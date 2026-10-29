import { useEffect, useState, type RefObject } from 'react';
import type { ChatMessage, Contact, Step } from '../../../core/types';
import { messageOptions } from '../../../core/interactive';
import { PhoneFrame } from './PhoneFrame';
import { MessageBubble } from './MessageBubble';
import { ListPicker } from './ListPicker';
import { FlowSheet } from '../../flows/components/FlowSheet';
import { useFlowSession } from '../../flows/hooks/useFlowSession';
import { advance, createSession, goBack } from '../../flows/model';

/** Isolated draft preview: reuse actual renderers without running or modifying the journey. */
export function MessagePreview({
  contact,
  step,
  phoneRef,
}: {
  contact: Contact;
  step: Step;
  phoneRef: RefObject<HTMLDivElement | null>;
}) {
  const [listOpen, setListOpen] = useState(false),
    [selected, setSelected] = useState(''),
    [flowError, setFlowError] = useState('');
  const flow = useFlowSession();
  const interactive = step.type === 'business' ? step.interactive : undefined;
  const selection =
    interactive && messageOptions(interactive).some((o) => o.id === selected) ? selected : '';
  const definition = step.type === 'flow' ? step.flow : null;
  useEffect(() => {
    flow.set(null);
    setFlowError('');
  }, [definition, flow.set]);
  const message: ChatMessage = {
    id: step.id,
    direction: step.type === 'user' ? 'user' : 'business',
    text: step.text,
    time: '12:00',
    interactive,
    flowStep: step.type === 'flow' ? step : undefined,
    selection,
  };
  return (
    <PhoneFrame contact={contact} phoneRef={phoneRef}>
      <div className="chat-body draft-chat" aria-label="Prévia da mensagem em edição">
        <div className="day">Hoje</div>
        <div className="messages">
          <MessageBubble
            message={message}
            running
            pendingId={step.id}
            onReply={(_, id) => setSelected(id)}
            onList={() => setListOpen(true)}
            onOpen={(value) => {
              flow.set(createSession(value));
              setFlowError('');
            }}
          />
        </div>
      </div>
      <div className="draft-preview-note">Prévia da mensagem · alterações em tempo real</div>
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
