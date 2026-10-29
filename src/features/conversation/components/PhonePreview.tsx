import { useEffect, useRef, type RefObject } from 'react';
import type { Contact } from '../../../core/types';
import type { Playback } from '../../playback/hooks/usePlayback';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageComposer } from './MessageComposer';
import { FlowSheet } from '../../flows/components/FlowSheet';
export function PhonePreview({
  contact,
  playback: p,
  phoneRef,
}: {
  contact: Contact;
  playback: Playback;
  phoneRef: RefObject<HTMLDivElement | null>;
}) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [p.messages, p.typing]);
  return (
    <div className="phone" ref={phoneRef}>
      <ChatHeader contact={contact} typing={p.typing} />
      <div className="chat-body" ref={body}>
        <div className="day">Hoje</div>
        <div className="messages" aria-live="polite">
          {p.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              running={p.running}
              onOpen={p.openFlow}
            />
          ))}
          {p.typing && <TypingIndicator />}
        </div>
      </div>
      <MessageComposer value={p.draft} onChange={p.setDraft} onSend={p.send} />
      {p.flow && (
        <FlowSheet
          session={p.flow}
          error={p.flowError}
          onChange={p.changeFlow}
          onBack={p.backFlow}
          onClose={p.closeFlow}
          onNext={p.nextFlow}
        />
      )}
      <div
        className={`touch-cursor ${p.cursor.pressed ? 'pressed' : ''}`}
        style={{ left: p.cursor.x, top: p.cursor.y, opacity: p.cursor.visible ? 1 : 0 }}
        aria-hidden="true"
      />
    </div>
  );
}
