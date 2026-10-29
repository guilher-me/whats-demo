import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type {
  BusinessInteractive,
  ChatMessage,
  FlowStep,
  Project,
  Value,
} from '../../../core/types';
import { clone, uid } from '../../../core/project';
import { resolve, validateProject } from '../../../core/engine';
import { deferred, delay } from '../../../core/async';
import { advance, createSession, getComponents, goBack, validation } from '../../flows/model';
import { useFlowSession } from '../../flows/hooks/useFlowSession';
import { useCursor } from './useCursor';
import { useMessageInteraction } from './useMessageInteraction';
import { animateMessage } from '../animateMessage';

export function usePlayback(phone: RefObject<HTMLDivElement | null>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]),
    [typing, setTyping] = useState(false),
    [draft, setDraftState] = useState(''),
    [running, setRunning] = useState(false),
    [activeStep, setActiveStep] = useState<string | null>(null),
    [status, setStatus] = useState('Escolha um modo para começar.'),
    [flowError, setFlowError] = useState('');
  const flow = useFlowSession(),
    cursor = useCursor(phone),
    controller = useRef<AbortController | null>(null),
    draftRef = useRef(''),
    waitingUser = useRef<(() => void) | null>(null),
    waitingFlow = useRef<(() => void) | null>(null);
  const setDraft = (value: string) => {
    draftRef.current = value;
    setDraftState(value);
  };
  const append = (
    text: string,
    direction: ChatMessage['direction'],
    step?: FlowStep,
    interactive?: BusinessInteractive,
  ) => {
    const message: ChatMessage = {
      id: uid(),
      direction,
      text,
      time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
        new Date(),
      ),
      flowStep: step,
      interactive,
    };
    setMessages((current) => [...current, message]);
    return message;
  };
  const interaction = useMessageInteraction((id, option) => {
    append(option.title, 'user');
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, selection: option.id } : message,
      ),
    );
  });
  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    waitingUser.current = null;
    waitingFlow.current = null;
    setRunning(false);
    setTyping(false);
    setActiveStep(null);
    flow.set(null);
    interaction.reset();
    cursor.hide();
    setStatus('Reprodução parada.');
  }, [flow.set, interaction.reset]);
  const reset = () => {
    stop();
    setMessages([]);
    setDraft('');
    setFlowError('');
    setStatus('Escolha um modo para começar.');
  };
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  const send = () => {
    const text = draftRef.current.trim();
    if (!text) return;
    append(text, 'user');
    setDraft('');
    const done = waitingUser.current;
    waitingUser.current = null;
    done?.();
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
      setStatus('Flow inválido: ' + (error as Error).message);
      throw error;
    }
  };
  const next = async () => {
    const session = flow.current.current,
      active = controller.current;
    if (!session || !active || session.closing) return;
    const result = advance(session);
    setFlowError('');
    if (result.session) {
      flushSync(() => flow.set(result.session));
      return;
    }
    flow.set({ ...session, closing: true });
    await delay(220, active.signal);
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
      await delay(250, signal);
      const components = getComponents(session);
      for (const c of components.filter((component) => component.name)) {
        const name = c.name!,
          value = resolve(session.step.answers[name], {
            data: session.data,
            form: flow.current.current?.form ?? {},
          });
        if (value === undefined) {
          if (c.required) throw new Error(`Defina uma resposta automática para “${name}”.`);
          continue;
        }
        if (c.type === 'RadioButtonsGroup') {
          const target = find(name, String(value));
          if (!target) throw new Error(`Resposta inexistente em ${name}.`);
          await cursor.touch(target, signal, () => flow.update(name, value));
        } else if (c.type === 'CheckboxGroup') {
          const values = Array.isArray(value) ? value : [value];
          const source = resolve(c['data-source'] as Value, {
            data: session.data,
            form: session.form,
          });
          if (!Array.isArray(source)) throw new Error('data-source inválido.');
          for (const option of source as { id: string }[]) {
            if (values.includes(option.id)) {
              const previous = flow.current.current?.form[name];
              const selected = Array.isArray(previous) ? previous : [];
              await cursor.touch(find(name, option.id), signal, () =>
                flow.update(name, [...selected, option.id]),
              );
            }
          }
        } else if (c.type === 'OptIn')
          await cursor.touch(find(name), signal, () => flow.update(name, Boolean(value)));
        else if (c.type === 'Dropdown')
          await cursor.touch(find(name), signal, () => flow.update(name, String(value)));
        else
          await cursor.type(
            find(name),
            String(value),
            signal,
            (text) => flow.update(name, text),
            c.type === 'DatePicker',
          );
      }
      const current = flow.current.current;
      if (!current) return;
      const errors = validation(current);
      if (errors.length) throw new Error(errors[0]);
      await cursor.touch(
        phone.current?.querySelector<HTMLElement>('[data-flow-next]') ?? null,
        signal,
      );
      await next();
      await delay(200, signal);
    }
    if (flow.current.current)
      throw new Error('O Flow excedeu 30 navegações. Confira possíveis ciclos.');
  };
  const run = async (project: Project, automatic: boolean) => {
    stop();
    setMessages([]);
    setDraft('');
    setFlowError('');
    const active = new AbortController();
    controller.current = active;
    const signal = active.signal;
    setRunning(true);
    try {
      const steps = clone(validateProject(project).steps);
      for (let index = 0; index < steps.length; index++) {
        const step = steps[index];
        if (signal.aborted) return;
        setActiveStep(step.id);
        setStatus(`${automatic ? 'Automático' : 'Manual'} · etapa ${index + 1} de ${steps.length}`);
        if (step.type === 'user') {
          // Install the listener immediately: a manual send during the configured delay must not be lost.
          const received = deferred(signal);
          waitingUser.current = received.finish;
          if (automatic) {
            await delay(step.delay * 1000, signal);
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
            setStatus('Digite a mensagem do cliente e envie para continuar.');
            phone.current?.querySelector<HTMLInputElement>('[data-composer-input]')?.focus();
          }
          await received.promise;
        } else {
          setTyping(step.typing !== false);
          await delay(step.delay * 1000, signal);
          setTyping(false);
          // Cursor targets must exist before the next animation; commit this message synchronously.
          let messageId = '';
          flushSync(() => {
            const message = append(
              step.text,
              'business',
              step.type === 'flow' ? step : undefined,
              step.type === 'business' ? step.interactive : undefined,
            );
            messageId = message.id;
          });
          if (step.type === 'business' && step.interactive) {
            const answered = interaction.wait(messageId, step.interactive, signal);
            setStatus('Escolha uma opção na mensagem para continuar.');
            if (automatic)
              await animateMessage({
                id: messageId,
                message: step.interactive,
                phone,
                signal,
                touch: cursor.touch,
                open: interaction.open,
                reply: interaction.reply,
                select: interaction.select,
                confirm: interaction.confirm,
              });
            await answered;
          }
          if (step.type === 'flow') {
            const completed = deferred(signal);
            waitingFlow.current = completed.finish;
            setStatus(
              automatic ? 'Abrindo Flow…' : 'Abra o Flow e preencha os campos para continuar.',
            );
            if (automatic) {
              await delay(100, signal);
              const target =
                [...(phone.current?.querySelectorAll<HTMLElement>('[data-open-step]') ?? [])].find(
                  (n) => n.dataset.openStep === step.id,
                ) ?? null;
              await cursor.touch(target, signal, () => openFlow(step));
              await animateFlow(signal);
            }
            await completed.promise;
          }
        }
      }
      if (controller.current === active) {
        flushSync(() => {
          controller.current = null;
          setRunning(false);
          setActiveStep(null);
          cursor.hide();
          setStatus('Conversa concluída.');
        });
      }
    } catch (error) {
      if (!signal.aborted && controller.current === active) {
        flushSync(() => {
          stop();
          setStatus('Reprodução interrompida: ' + (error as Error).message);
        });
      }
    }
  };
  return {
    messages,
    typing,
    draft,
    setDraft,
    send,
    running,
    activeStep,
    status,
    flow: flow.session,
    flowError,
    cursor: cursor.cursor,
    run,
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
      setStatus('Flow fechado. Clique no convite para abrir novamente.');
    },
  };
}
export type Playback = ReturnType<typeof usePlayback>;
