import { CommerceSheet } from '../../commerce/CommerceSheet';
import { useCommercePlayback } from '../../commerce/useCommercePlayback';
import { useT } from '../../../i18n';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Attachment, ChatMessage, CommerceMessage, Contact, Step } from '../../../core/types';
import { messageOptions } from '../../../core/interactive';
import { usePhoneTime } from '../phone-time';
import { PhoneFrame } from './PhoneFrame';
import { MessageBubble } from './MessageBubble';
import { ListPicker } from './ListPicker';
import { FlowSheet } from '../../flows/components/FlowSheet';
import { useFlowSession } from '../../flows/hooks/useFlowSession';
import { advance, createSession, goBack, refreshPreviewSession } from '../../flows/model';

export interface FlowPreviewRequest {
  stepId: string;
  screenId?: string;
}

/** Isolated draft preview: reuse actual renderers without running or modifying the journey. */
export function MessagePreview({
  contact,
  step,
  phoneRef,
  attachment,
  commerce,
  flowPreview,
}: {
  contact: Contact;
  step: Step;
  phoneRef: RefObject<HTMLDivElement | null>;
  attachment?: Attachment;
  commerce?: CommerceMessage;
  flowPreview?: FlowPreviewRequest;
}) {
  const t = useT();
  const time = usePhoneTime();

  const [listOpen, setListOpen] = useState(false),
    [selected, setSelected] = useState(''),
    [flowError, setFlowError] = useState(''),
    [completed, setCompleted] = useState(false);
  const flow = useFlowSession();
  const commercePlayback = useCommercePlayback();
  const openCommerce = () => {
    if (commerce?.kind === 'offer') commercePlayback.openOffer(step.id, commerce, true);
    if (commerce?.kind === 'pix') commercePlayback.copyPix(step.id);
  };
  const interactive = step.type === 'business' ? step.interactive : undefined;
  const selection =
    interactive && messageOptions(interactive).some((o) => o.id === selected) ? selected : '';
  const flowStep = step.type === 'flow' ? step : null;
  const previousRequest = useRef<FlowPreviewRequest | undefined>(undefined);
  useEffect(() => {
    const current = flow.current.current;
    const requested = previousRequest.current !== flowPreview;
    previousRequest.current = flowPreview;
    if (!flowStep || (!requested && (!current || current.step.flow === flowStep.flow))) return;

    setFlowError('');
    try {
      if (requested) {
        setCompleted(false);
        flow.set(flowPreview ? createSession(flowStep, flowPreview.screenId) : null);
      } else if (current) {
        flow.set(refreshPreviewSession(current, flowStep));
      }
    } catch (error) {
      setFlowError((error as Error).message);
    }
  }, [flowStep, flowPreview, flow.current, flow.set]);
  const message: ChatMessage = {
    id: step.id,
    direction: step.type === 'user' ? 'user' : 'business',
    text:
      step.type === 'user' && step.commerce
        ? ''
        : step.type !== 'flow' && step.media
          ? (step.media.caption ?? '')
          : step.text,
    attachment,
    commerce,
    time,
    ...(step.type === 'user' && step.voiceDurationSeconds !== undefined
      ? { voiceDurationMs: step.voiceDurationSeconds * 1000 }
      : {}),
    interactive,
    flowStep: step.type === 'flow' ? step : undefined,
    selection,
  };
  return (
    <PhoneFrame
      time={time}
      contact={contact}
      phoneRef={phoneRef}
      pixCopied={commercePlayback.pixCopied}
    >
      <div className="chat-body draft-chat" aria-label={t('app.draft')}>
        <div className="day">{t('phone.today')}</div>
        <div className="messages">
          <MessageBubble
            message={message}
            phoneRef={phoneRef}
            running
            onCommerce={
              commerce?.kind === 'pix' ||
              (commerce?.kind === 'offer' &&
                commerce.sections.some(({ products }) => products.length))
                ? openCommerce
                : undefined
            }
            pendingId={step.id}
            onReply={(_, id) => setSelected(id)}
            onList={() => setListOpen(true)}
            onOpen={(value) => {
              setCompleted(false);
              flow.set(createSession(value));
              setFlowError('');
            }}
          />
        </div>
      </div>
      <div className="draft-preview-note" role="status">
        {completed
          ? t('builder.testCompleted')
          : !flow.session && flowError
            ? flowError
            : t('phone.draftNote')}
      </div>
      <CommerceSheet
        controls={commercePlayback}
        container={phoneRef.current}
        locked={false}
        returnFocus={() =>
          phoneRef.current?.querySelector<HTMLElement>('[data-commerce-action]')?.focus()
        }
      />
      {listOpen && interactive?.kind === 'list' && (
        <ListPicker
          message={interactive}
          selected={selection}
          container={phoneRef.current}
          onSelect={setSelected}
          onConfirm={() => setListOpen(false)}
          onClose={() => setListOpen(false)}
        />
      )}
      {flow.session && (
        <FlowSheet
          contact={contact}
          session={flow.session}
          error={flowError}
          onChange={(name, value) => {
            flow.update(name, value);
            setFlowError('');
          }}
          onBack={() => {
            if (flow.current.current) flow.set(goBack(flow.current.current));
          }}
          onClose={() => flow.set(null)}
          onNext={() => {
            try {
              if (!flow.current.current) return;
              const result = advance(flow.current.current);
              flow.set(result.session ?? null);
              setCompleted(!result.session);
              setFlowError('');
            } catch (error) {
              setFlowError((error as Error).message);
            }
          }}
        />
      )}
    </PhoneFrame>
  );
}
