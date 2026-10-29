import { useT } from '../../../i18n';
import { useEffect, useRef, type RefObject } from 'react';
import type { Contact } from '../../../core/types';
import type { Playback } from '../../playback/hooks/usePlayback';
import { PhoneFrame } from './PhoneFrame';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageComposer } from './MessageComposer';
import { FlowSheet } from '../../flows/components/FlowSheet';
import { ListPicker } from './ListPicker';
export function PhonePreview({
  contact,
  playback: p,
  phoneRef,
}: {
  contact: Contact;
  playback: Playback;
  phoneRef: RefObject<HTMLDivElement | null>;
}) {
  const t = useT();

  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [p.messages, p.typing]);
  return (
    <PhoneFrame contact={contact} typing={p.typing} phoneRef={phoneRef}>
      <div className="chat-body" ref={body}>
        <div className="day">{t('phone.today')}</div>
        <div
          className="messages"
          role="log"
          aria-label={t('phone.log')}
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="false"
        >
          {p.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              running={p.running}
              onOpen={p.openFlow}
              pendingId={p.interaction.pendingId}
              onReply={p.interaction.reply}
              onList={p.interaction.open}
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
      {p.interaction.list && (
        <ListPicker
          message={p.interaction.list.message}
          selected={p.interaction.selection}
          container={phoneRef.current}
          onSelect={p.interaction.select}
          onConfirm={p.interaction.confirm}
          onClose={p.interaction.close}
        />
      )}
      <div
        className={`touch-cursor ${p.cursor.pressed ? 'pressed' : ''}`}
        style={{ left: p.cursor.x, top: p.cursor.y, opacity: p.cursor.visible ? 1 : 0 }}
        aria-hidden="true"
      />
    </PhoneFrame>
  );
}
