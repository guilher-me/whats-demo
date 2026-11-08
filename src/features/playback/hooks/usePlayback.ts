import { t, useT, type MessageKey } from '../../../i18n';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type {
  ChatMessage,
  CommerceMessage,
  FlowComponent,
  FlowStep,
  OrderLine,
  Project,
  Value,
} from '../../../core/types';
import { clone, uid } from '../../../core/project';
import { validateProject } from '../../../core/engine';
import { deferred, delay } from '../../../core/async';
import { advance, createSession, getComponents, goBack, validation } from '../../flows/model';
import { useFlowSession } from '../../flows/hooks/useFlowSession';
import { useCursor } from './useCursor';
import { useMessageInteraction } from './useMessageInteraction';
import { animateMessage } from '../animateMessage';
import { messageOptions } from '../../../core/interactive';
import { usePlaybackSpeed } from './usePlaybackSpeed';
import { PlaybackClock } from '../playbackClock';
import { flowReadingText } from '../../flows/reading';
import { automaticAnswer } from '../../flows/answers';
import { conversationAttachments, stepAttachment } from '../../../core/attachments';
import { useAttachmentPlayback } from './useAttachmentPlayback';
import { autoCart, offerMessage, offerOf, pixMessage, subtotal } from '../../../core/commerce';
import { useCommercePlayback } from '../../commerce/useCommercePlayback';

export function usePlayback(phone: RefObject<HTMLDivElement | null>, persistSpeed = true) {
  useT();
  const { speed, current: speedRef, setSpeed } = usePlaybackSpeed(persistSpeed);
  const automaticMode = useRef(false);
  const clock = useRef<PlaybackClock | null>(null);
  const sleep = useCallback(
    (milliseconds: number, signal: AbortSignal) =>
      clock.current?.signal === signal
        ? clock.current.delay(milliseconds)
        : delay(milliseconds, signal),
    [],
  );
  // Read the current preference at each animation boundary, including during a run.
  const wait = useCallback(
    (milliseconds: number, signal: AbortSignal) =>
      sleep(milliseconds / (automaticMode.current ? speedRef.current : 1), signal),
    [sleep],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]),
    [typing, setTyping] = useState(false),
    [draft, setDraftState] = useState(''),
    [voiceComposer, setVoiceComposer] = useState(false),
    [recordingVoice, setRecordingVoice] = useState(false),
    [running, setRunning] = useState(false),
    [paused, setPaused] = useState(false),
    [activeStep, setActiveStep] = useState<string | null>(null),
    [statusMessage, setStatusMessage] = useState<{
      key: MessageKey;
      values?: Record<string, unknown>;
    }>({ key: 'playback.choose' }),
    [flowError, setFlowError] = useState('');
  const setStatus = useCallback(
    (key: MessageKey, values?: Record<string, unknown>) => setStatusMessage({ key, values }),
    [],
  );
  const flow = useFlowSession(),
    media = useAttachmentPlayback(),
    commerce = useCommercePlayback(),
    cursor = useCursor(phone, wait),
    controller = useRef<AbortController | null>(null),
    draftRef = useRef(''),
    waitingUser = useRef<(() => void) | null>(null),
    waitingVoice = useRef<(() => void) | null>(null),
    waitingAttachment = useRef<(() => void) | null>(null),
    voiceStartedAt = useRef<number | null>(null),
    waitingFlow = useRef<(() => void) | null>(null);
  const setDraft = (value: string) => {
    draftRef.current = value;
    setDraftState(value);
  };
  const append = (
    text: string,
    direction: ChatMessage['direction'],
    content?: Pick<
      ChatMessage,
      'flowStep' | 'interactive' | 'voiceDurationMs' | 'attachment' | 'commerce'
    >,
  ) => {
    const message: ChatMessage = {
      id: uid(),
      direction,
      text,
      time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
        new Date(),
      ),
      ...content,
      receipt: direction === 'user' ? 'delivered' : undefined,
    };
    setMessages((current) => [
      ...current.map((previous) =>
        direction === 'business' && previous.direction === 'user' && previous.receipt !== 'read'
          ? { ...previous, receipt: 'read' as const }
          : previous,
      ),
      message,
    ]);
    return message;
  };
  const interaction = useMessageInteraction((id, option, isResponse) => {
    if (isResponse) append(option.title, 'user');
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, selection: option.id } : message,
      ),
    );
  });
  const cancelVoice = useCallback(() => {
    voiceStartedAt.current = null;
    setRecordingVoice(false);
  }, []);
  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    clock.current = null;
    setPaused(false);
    automaticMode.current = false;
    waitingUser.current = null;
    waitingVoice.current = null;
    waitingAttachment.current = null;
    media.set(null);
    commerce.reset();
    setVoiceComposer(false);
    cancelVoice();
    waitingFlow.current = null;
    setRunning(false);
    setTyping(false);
    setActiveStep(null);
    flow.set(null);
    interaction.reset();
    cursor.hide();
    setStatus('playback.stopped');
  }, [flow.set, interaction.reset, cancelVoice, media.set, commerce.reset]);
  const pause = () => {
    if (!controller.current || clock.current?.paused) return;
    if (!automaticMode.current) cancelVoice();
    clock.current?.pause();
    setPaused(true);
  };
  const resume = () => {
    if (!controller.current || !clock.current?.paused) return;
    clock.current.resume();
    setPaused(false);
  };
  const reset = () => {
    stop();
    setMessages([]);
    setDraft('');
    setFlowError('');
    setStatus('playback.choose');
  };
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  const send = () => {
    const text = draftRef.current.trim();
    if (
      !text ||
      clock.current?.paused ||
      waitingVoice.current ||
      waitingAttachment.current ||
      commerce.current.current
    )
      return;
    append(text, 'user');
    setDraft('');
    const done = waitingUser.current;
    waitingUser.current = null;
    done?.();
  };
  const beginVoice = () => {
    const playbackClock = clock.current;
    if (
      !waitingVoice.current ||
      !playbackClock ||
      playbackClock.paused ||
      voiceStartedAt.current !== null
    )
      return false;
    voiceStartedAt.current = playbackClock.now();
    setRecordingVoice(true);
    return true;
  };
  const voiceElapsed = useCallback(() => {
    const startedAt = voiceStartedAt.current;
    return startedAt === null ? 0 : Math.max(0, (clock.current?.now() ?? startedAt) - startedAt);
  }, []);
  const sendVoice = (configuredMs?: number) => {
    const done = waitingVoice.current;
    if (!done || clock.current?.paused || voiceStartedAt.current === null) return;
    waitingVoice.current = null;
    const duration = configuredMs ?? Math.round(voiceElapsed());
    // The following text step needs its composer mounted before the cursor can target it.
    flushSync(() => {
      append('', 'user', { voiceDurationMs: duration });
      cancelVoice();
      setVoiceComposer(false);
    });
    done();
  };
  const sendAttachment = () => {
    const done = waitingAttachment.current;
    const session = media.current.current;
    const selected = session?.selected;
    if (!done || !selected || clock.current?.paused) return;
    if (session.view !== 'preview' && !(session.view === 'items' && selected.kind === 'image'))
      return;
    waitingAttachment.current = null;
    flushSync(() => {
      append(session.caption, 'user', { attachment: selected });
      media.set(null);
    });
    done();
  };
  const openFlow = (step: FlowStep) => {
    setFlowError('');
    try {
      const existing = flow.current.current;
      flushSync(() =>
        flow.set(
          existing?.step.id === step.id ? { ...existing, visible: true } : createSession(step),
        ),
      );
    } catch (error) {
      setStatus('playback.invalidFlow', { v0: (error as Error).message });
      throw error;
    }
  };
  const next = async () => {
    const session = flow.current.current,
      active = controller.current;
    if (!session || !active || session.closing || clock.current?.paused) return;
    const result = advance(session);
    setFlowError('');
    if (result.session) {
      flushSync(() => flow.set(result.session));
      return;
    }
    flow.set({ ...session, closing: true });
    await sleep(220, active.signal);
    if (controller.current !== active) return;
    flow.set(null);
    if (session.step.completion) append(session.step.completion, 'user');
    setMessages((current) =>
      current.map((message) =>
        message.flowStep?.id === session.step.id ? { ...message, completed: true } : message,
      ),
    );
    const done = waitingFlow.current;
    waitingFlow.current = null;
    done?.();
  };
  const find = (name: string, option?: string): HTMLElement | null =>
    [...(phone.current?.querySelectorAll<HTMLElement>('[data-field]') ?? [])].find(
      (n) => n.dataset.field === name && (option === undefined || n.dataset.option === option),
    ) ?? null;
  const animateFlow = async (signal: AbortSignal) => {
    for (let turn = 0; flow.current.current && turn < 30; turn++) {
      const session = flow.current.current;
      await sleep(250, signal);
      const visited = new Set<FlowComponent>();
      await cursor.read(session.step.flow.screens[session.index].title, signal);
      for (;;) {
        const active = flow.current.current;
        if (!active || signal.aborted) return;
        const c = getComponents(active).find(
          (component) => component.type !== 'Footer' && !visited.has(component),
        );
        if (!c) break;
        visited.add(c);
        const context = { data: active.data, form: active.form };
        if (c.name) find(c.name)?.scrollIntoView?.({ block: 'nearest' });
        const reading = flowReadingText(c, context);
        if (reading) await cursor.read(reading, signal);
        if (!c.name) continue;
        const name = c.name;
        const { value, error, options } = automaticAnswer(c, active.step.answers, context);
        if (error) throw new Error(error);
        if (value === undefined) continue;

        if (c.type === 'RadioButtonsGroup') {
          const target = find(name, String(value));
          if (!target) throw new Error(t('errors.missingAnswer', { v0: name }));
          await cursor.touch(target, signal, () => flow.update(name, value));
        } else if (c.type === 'CheckboxGroup' && Array.isArray(value)) {
          const selected: string[] = [];
          for (const option of options ?? []) {
            if (!value.includes(option.id)) continue;
            selected.push(option.id);
            await cursor.touch(find(name, option.id), signal, () =>
              flow.update(name, [...selected]),
            );
          }
          if (!selected.length) flow.update(name, []);
        } else if (c.type === 'OptIn') {
          if (value === true) await cursor.touch(find(name), signal, () => flow.update(name, true));
          else flow.update(name, false);
        } else if (c.type === 'Dropdown') {
          await cursor.touch(find(name), signal, () => flow.update(name, value));
        } else {
          await cursor.type(
            find(name),
            String(value),
            signal,
            (text) => flow.update(name, text),
            c.type === 'DatePicker',
          );
        }
      }
      const current = flow.current.current;
      if (!current) return;
      const errors = validation(current);
      if (errors.length) throw new Error(errors[0]);
      const footer = getComponents(current).find((component) => component.type === 'Footer');
      if (footer) {
        const reading = flowReadingText(footer, { data: current.data, form: current.form });
        if (reading) await cursor.read(reading, signal);
      }
      await cursor.touch(
        phone.current?.querySelector<HTMLElement>('[data-flow-next]') ?? null,
        signal,
      );
      await next();
      await sleep(200, signal);
    }
    if (flow.current.current) throw new Error(t('errors.cycles'));
  };
  const run = async (project: Project, automatic: boolean, initialMessage?: string) => {
    stop();
    setMessages([]);
    setDraft('');
    setFlowError('');
    const active = new AbortController();
    automaticMode.current = automatic;
    controller.current = active;
    clock.current = new PlaybackClock(active.signal);
    const signal = active.signal;
    setRunning(true);
    try {
      const validated = validateProject(project);
      const { steps, catalog = [] } = clone(validated);
      const offers = new Map<string, ChatMessage>();
      const orders = new Map<string, OrderLine[]>();
      const target = (selector: string) =>
        phone.current?.querySelector<HTMLElement>(selector) ?? null;
      const targetIn = (selector: string, attribute: string, value: string) =>
        Array.from(phone.current?.querySelectorAll<HTMLElement>(selector) ?? []).find(
          (node) => node.getAttribute(attribute) === value,
        ) ?? null;
      const tap = (element: HTMLElement | null, action: () => void) =>
        cursor.touch(element, signal, () => flushSync(action));
      const attachments = conversationAttachments(validated);
      const openingMessage = !automatic ? initialMessage?.trim() : undefined;
      if (openingMessage) append(openingMessage, 'user');
      // The submitted text fulfills only an opening customer step; later replies still wait.
      const first = steps[0];
      const startIndex =
        openingMessage &&
        first?.type === 'user' &&
        first.voiceDurationSeconds === undefined &&
        !first.media &&
        !first.commerce
          ? 1
          : 0;
      for (let index = startIndex; index < steps.length; index++) {
        const step = steps[index];
        if (signal.aborted) return;
        setActiveStep(step.id);
        setStatus('playback.progress', {
          v0: automatic ? 'playback.autoMode' : 'playback.manualMode',
          v1: index + 1,
          v2: steps.length,
        });
        if (step.type === 'user') {
          // Register the expected input before the composer can submit.
          const received = deferred(signal);
          if (step.commerce?.kind === 'cart') {
            const { offerId, autoItems } = step.commerce;
            const offer = offers.get(offerId);
            const definition = offerOf(steps.find(({ id }) => id === offerId));
            if (!offer || offer.commerce?.kind !== 'offer' || !definition)
              throw new Error(t('commerce.invalidCart'));
            const content = offer.commerce;
            flushSync(() =>
              commerce.startCart(offer.id, content, (lines) => {
                orders.set(step.id, lines);
                append('', 'user', { commerce: { kind: 'order', lines } });
                received.finish();
              }),
            );
            setStatus('commerce.waitCart');
            const open = () =>
              targetIn(
                '[data-message-id]',
                'data-message-id',
                offer.id,
              )?.querySelector<HTMLElement>('[data-commerce-action]') ?? null;
            if (automatic) {
              await wait(step.delay * 1000, signal);
              await tap(open(), () => commerce.openOffer(offer.id, content, false));
              const items = autoCart(definition, autoItems);
              for (const item of items) {
                if (!content.single)
                  await tap(
                    targetIn('[data-commerce-product]', 'data-commerce-product', item.sku),
                    () => commerce.select(item.sku),
                  );
                await tap(target('[data-commerce-add]'), commerce.add);
              }
              await tap(target('[data-commerce-review]'), commerce.showCart);
              for (const { sku, quantity } of items) {
                if (quantity === 1) continue;
                await cursor.type(
                  targetIn('[data-commerce-quantity]', 'data-commerce-quantity', sku),
                  String(quantity),
                  signal,
                  (value) => {
                    if (value) flushSync(() => commerce.quantity(sku, Number(value)));
                  },
                  true,
                );
              }
              await tap(target('[data-commerce-send]'), commerce.submit);
            } else {
              open()?.focus();
            }
          } else if (step.media) {
            const item = stepAttachment(step);
            if (!item) throw new Error(t('attachments.required'));
            waitingAttachment.current = received.finish;
            flushSync(() =>
              media.set({
                kind: item.kind,
                items: attachments.filter((attachment) => attachment.kind === item.kind),
                view: 'closed',
                caption: '',
              }),
            );
            if (automatic) {
              const target = (selector: string) =>
                phone.current?.querySelector<HTMLElement>(selector) ?? null;
              await wait(step.delay * 1000, signal);
              await cursor.touch(target('[data-attach]'), signal, () => flushSync(media.open));
              await cursor.touch(target('[data-attachment-kind]'), signal, () =>
                flushSync(media.showItems),
              );
              const tile = Array.from(
                phone.current?.querySelectorAll<HTMLElement>('[data-attachment-item]') ?? [],
              ).find((tile) => tile.dataset.attachmentItem === item.id);
              await cursor.touch(tile ?? null, signal, () =>
                flushSync(() => media.select(item.id)),
              );
              if (step.media.caption)
                await cursor.type(
                  target('[data-attachment-caption]'),
                  step.media.caption,
                  signal,
                  media.caption,
                );
              await cursor.touch(target('[data-send-attachment]'), signal, sendAttachment);
            } else {
              setStatus('attachments.wait');
              phone.current?.querySelector<HTMLButtonElement>('[data-attach]')?.focus();
            }
          } else if (step.voiceDurationSeconds !== undefined) {
            const durationMs = step.voiceDurationSeconds * 1000;
            waitingVoice.current = received.finish;
            flushSync(() => setVoiceComposer(true));
            if (automatic) {
              await wait(step.delay * 1000, signal);
              await cursor.press(
                phone.current?.querySelector<HTMLElement>('[data-voice-mic]') ?? null,
                signal,
                async () => {
                  beginVoice();
                  await sleep(durationMs, signal);
                  sendVoice(durationMs);
                },
              );
            } else {
              setStatus('playback.holdVoice');
              phone.current?.querySelector<HTMLButtonElement>('[data-voice-mic]')?.focus();
            }
          } else {
            waitingUser.current = received.finish;
            if (automatic) {
              await wait(step.delay * 1000, signal);
              await cursor.type(
                phone.current?.querySelector<HTMLElement>('[data-composer-input]') ?? null,
                step.text,
                signal,
                setDraft,
              );
              await cursor.touch(
                phone.current?.querySelector<HTMLElement>('[data-send]') ?? null,
                signal,
                send,
              );
            } else {
              setStatus('playback.typeMessage');
              phone.current?.querySelector<HTMLInputElement>('[data-composer-input]')?.focus();
            }
          }
          await received.promise;
          await clock.current?.checkpoint();
        } else {
          if (step.typingMs !== undefined) {
            setTyping(false);
            await sleep(step.delay * 1000, signal);
            setTyping(step.typing !== false);
            await sleep(step.typingMs, signal);
          } else {
            setTyping(step.typing !== false);
            await sleep(step.delay * 1000, signal);
          }
          setTyping(false);
          const text =
            step.type === 'business' && step.media ? (step.media.caption ?? '') : step.text;
          // Cursor targets must exist before the next animation; commit this message synchronously.
          let commerceContent: CommerceMessage | undefined;
          const offer = offerOf(step);
          if (offer) commerceContent = offerMessage(offer, catalog);
          if (step.type === 'business' && step.commerce?.kind === 'pix') {
            const amount = step.commerce.amount;
            commerceContent = pixMessage(
              index,
              'cents' in amount ? amount.cents : subtotal(orders.get(amount.cartId) ?? []),
            );
          }
          const payment = commerceContent?.kind === 'pix' ? deferred(signal) : undefined;
          let messageId = '';
          flushSync(() => {
            const message = append(text, 'business', {
              flowStep: step.type === 'flow' ? step : undefined,
              interactive: step.type === 'business' ? step.interactive : undefined,
              attachment: stepAttachment(step),
              commerce: commerceContent,
            });
            messageId = message.id;
            if (offer) offers.set(step.id, message);
            if (payment && commerceContent?.kind === 'pix')
              commerce.startPix(messageId, payment.finish);
          });
          if (automatic) {
            const choices =
              step.type === 'business' && step.interactive?.kind === 'buttons'
                ? messageOptions(step.interactive)
                    .map((option) => option.title)
                    .join(' ')
                : '';
            await cursor.read(`${text} ${choices}`, signal);
          }
          if (payment) {
            setStatus('commerce.waitPix');
            const open =
              targetIn(
                '[data-message-id]',
                'data-message-id',
                messageId,
              )?.querySelector<HTMLElement>('[data-commerce-action]') ?? null;
            if (automatic) {
              await tap(open, () => commerce.copyPix(messageId));
            } else {
              open?.focus();
            }
            await payment.promise;
            await clock.current?.checkpoint();
          }
          if (step.type === 'business' && step.interactive) {
            const answered = interaction.wait(messageId, step.interactive, signal);
            setStatus('playback.chooseOption');
            if (automatic)
              await animateMessage({
                id: messageId,
                message: step.interactive,
                phone,
                signal,
                touch: cursor.touch,
                read: cursor.read,
                open: interaction.open,
                reply: interaction.reply,
                select: interaction.select,
                confirm: interaction.confirm,
              });
            await answered;
            await clock.current?.checkpoint();
          }
          if (step.type === 'flow') {
            const completed = deferred(signal);
            waitingFlow.current = completed.finish;
            setStatus(automatic ? 'playback.openingFlow' : 'playback.openFlow');
            if (automatic) {
              await sleep(100, signal);
              const target =
                [...(phone.current?.querySelectorAll<HTMLElement>('[data-open-step]') ?? [])].find(
                  (n) => n.dataset.openStep === step.id,
                ) ?? null;
              await cursor.touch(target, signal, () => openFlow(step));
              await animateFlow(signal);
            }
            await completed.promise;
            await clock.current?.checkpoint();
          }
        }
      }
      if (controller.current === active) {
        flushSync(() => {
          controller.current = null;
          clock.current?.dispose();
          clock.current = null;
          setPaused(false);
          automaticMode.current = false;
          setRunning(false);
          setActiveStep(null);
          cursor.hide();
          setStatus('playback.completed');
        });
      }
    } catch (error) {
      if (!signal.aborted && controller.current === active) {
        flushSync(() => {
          stop();
          setStatus('playback.interrupted', { v0: (error as Error).message });
        });
      }
    }
  };
  return {
    speed,
    setSpeed,
    cursorSpeed: running && automaticMode.current ? speed : 1,
    messages,
    typing,
    draft,
    setDraft,
    send,
    voiceComposer,
    recordingVoice,
    voiceElapsed,
    beginVoice,
    sendVoice,
    cancelVoice,
    media,
    commerce,
    sendAttachment,
    running,
    paused,
    pause,
    resume,
    automatic: running && automaticMode.current,
    activeStep,
    status: t(
      paused ? 'playback.paused' : statusMessage.key,
      statusMessage.key === 'playback.progress'
        ? { ...statusMessage.values, v0: t(statusMessage.values!.v0 as MessageKey) }
        : statusMessage.values,
    ),
    flow: flow.session,
    flowError,
    cursor: cursor.cursor,
    run,
    sendOrStart: (project: Project) => {
      if (automaticMode.current || clock.current?.paused) return;
      if (controller.current) {
        send();
        return;
      }
      const text = draftRef.current.trim();
      if (text) void run(project, false, text);
    },
    stop,
    reset,
    interaction,
    openFlow: (step: FlowStep) => {
      try {
        openFlow(step);
      } catch {
        /* Error is presented in the preview status. */
      }
    },
    changeFlow: (name: string, value: Value) => {
      setFlowError('');
      flow.update(name, value);
    },
    nextFlow: () => {
      void next().catch((error) => {
        if (!controller.current?.signal.aborted) setFlowError((error as Error).message);
      });
    },
    backFlow: () => {
      if (flow.current.current) {
        setFlowError('');
        flow.set(goBack(flow.current.current));
      }
    },
    closeFlow: () => {
      if (flow.current.current) flow.set({ ...flow.current.current, visible: false });
      setStatus('playback.flowClosed');
    },
  };
}
export type Playback = ReturnType<typeof usePlayback>;
