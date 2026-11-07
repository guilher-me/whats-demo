import { useT } from '../../../i18n';
import { useEffect, useRef, type RefObject } from 'react';
import type { Contact } from '../../../core/types';
import type { Playback } from '../../playback/hooks/usePlayback';
import { PhoneFrame } from './PhoneFrame';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageComposer } from './MessageComposer';
import { VoiceComposer } from './VoiceComposer';
import { FlowSheet } from '../../flows/components/FlowSheet';
import { ListPicker } from './ListPicker';
import { AttachmentPicker } from './AttachmentPicker';
export function PhonePreview({
  contact,
  playback: p,
  phoneRef,
  onSend,
  onStartVoice,
  onStartAttachment,
  composerDisabled = false,
}: {
  contact: Contact;
  playback: Playback;
  phoneRef: RefObject<HTMLDivElement | null>;
  onSend?: () => void;
  onStartVoice?: () => void;
  onStartAttachment?: () => void;
  composerDisabled?: boolean;
}) {
  const t = useT();

  const body = useRef<HTMLDivElement>(null);
  const attach = p.media.session || (!p.running && onStartAttachment);
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [p.messages, p.typing]);
  useEffect(() => {
    if (!p.paused) return;
    const animations =
      phoneRef.current
        ?.getAnimations?.({ subtree: true })
        .filter((a) => a.playState === 'running') ?? [];
    animations.forEach((animation) => animation.pause());
    return () => animations.forEach((animation) => animation.play());
  }, [p.paused, phoneRef]);
  return (
    <PhoneFrame contact={contact} typing={p.typing} paused={p.paused} phoneRef={phoneRef}>
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
              phoneRef={phoneRef}
              attachmentDisabled={
                p.automatic || (!!p.media.session && p.media.session.view !== 'closed')
              }
            />
          ))}
          {p.typing && <TypingIndicator />}
        </div>
      </div>
      {p.voiceComposer || (!p.running && onStartVoice) ? (
        <VoiceComposer
          recording={p.recordingVoice}
          elapsed={p.voiceElapsed}
          paused={p.paused}
          disabled={composerDisabled || p.automatic || p.paused}
          onBegin={() => {
            if (!p.running) onStartVoice?.();
            return p.beginVoice();
          }}
          onSend={p.sendVoice}
          onCancel={p.cancelVoice}
        />
      ) : (
        <MessageComposer
          value={attach ? '' : p.draft}
          onChange={p.setDraft}
          onSend={onSend ?? p.send}
          disabled={!!attach || composerDisabled || p.automatic || p.paused}
          attachmentDisabled={composerDisabled || p.automatic || p.paused}
          onAttach={
            attach
              ? () => {
                  if (!p.running) onStartAttachment?.();
                  p.media.open();
                }
              : undefined
          }
        />
      )}
      <AttachmentPicker
        media={p.media}
        container={phoneRef.current}
        disabled={p.automatic || p.paused}
        onSend={p.sendAttachment}
      />
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
        style={{
          left: p.cursor.x,
          top: p.cursor.y,
          opacity: p.cursor.visible ? 1 : 0,
          transition:
            p.cursor.travelMs === undefined
              ? undefined
              : `left calc(${p.cursor.travelMs}ms / var(--cursor-speed, 1)) cubic-bezier(.4,0,.2,1), top calc(${p.cursor.travelMs}ms / var(--cursor-speed, 1)) cubic-bezier(.4,0,.2,1), opacity 0.15s`,
        }}
        aria-hidden="true"
      />
    </PhoneFrame>
  );
}
