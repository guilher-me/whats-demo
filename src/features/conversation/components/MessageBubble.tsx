import { CommerceAction, CommerceCard } from '../../commerce/CommerceCards';
import type { ChatMessage, FlowStep } from '../../../core/types';
import { MessageFrame } from './MessageFrame';
import { BusinessMessageActions } from './BusinessMessageActions';
import { FormattedMessageText } from './FormattedMessageText';
import { VoiceMessage } from './VoiceMessage';
import { useRef, useState, type RefObject } from 'react';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { useT } from '../../../i18n';
import { AttachmentDetails, AttachmentVisual } from './AttachmentVisual';
export function MessageBubble({
  message,
  running,
  pendingId,
  onOpen,
  onReply,
  onList,
  phoneRef,
  attachmentDisabled,
  onCommerce,
  commercePlaybackLocked,
  cartCount,
}: {
  message: ChatMessage;
  running: boolean;
  pendingId: string | null;
  onOpen: (step: FlowStep) => void;
  onReply: (messageId: string, optionId: string) => void;
  onList: (messageId: string) => void;
  phoneRef?: RefObject<HTMLDivElement | null>;
  attachmentDisabled?: boolean;
  onCommerce?: () => void;
  commercePlaybackLocked?: boolean;
  cartCount?: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const attachment = message.attachment;
  return (
    <MessageFrame
      id={message.id}
      direction={message.direction}
      time={message.time}
      receipt={message.receipt}
      voice={message.voiceDurationMs !== undefined}
      interactive={!!message.flowStep || !!message.interactive || !!message.commerce}
      actions={
        message.commerce ? (
          <CommerceAction
            value={message.commerce}
            count={cartCount}
            enabled={!!onCommerce}
            playbackLocked={commercePlaybackLocked}
            onClick={onCommerce}
          />
        ) : (
          <BusinessMessageActions
            message={message}
            running={running}
            pendingId={pendingId}
            onOpen={onOpen}
            onReply={onReply}
            onList={onList}
          />
        )
      }
    >
      {message.interactive?.header && (
        <div className="message-header">{message.interactive.header}</div>
      )}
      {message.commerce && <CommerceCard value={message.commerce} />}
      {attachment ? (
        <div className="message-attachment">
          <button
            type="button"
            ref={trigger}
            className={`message-attachment-preview ${attachment.kind}`}
            aria-label={attachment.name}
            disabled={attachmentDisabled}
            onClick={() => setOpen(true)}
          >
            <AttachmentVisual item={attachment} />
            {attachment.kind === 'location' && (
              <span className="message-location-name">
                <strong>{attachment.name}</strong>
                {attachment.address && <small>{attachment.address}</small>}
              </span>
            )}
            {attachment.kind === 'document' && (
              <span className="message-document-name">
                <strong>{attachment.name}</strong>
                <small>
                  {attachment.extension.toUpperCase()} · {attachment.sizeLabel}
                </small>
              </span>
            )}
          </button>
          {attachment.kind === 'image' && message.text && (
            <p>
              <FormattedMessageText text={message.text} segments={message.formattedText} />
            </p>
          )}
          {open && (
            <PhoneSheet
              container={phoneRef?.current ?? null}
              title={attachment.name}
              description={t('attachments.preview')}
              closeLabel={t('common.closeDialog')}
              onClose={() => setOpen(false)}
              onReturnFocus={() => trigger.current?.focus()}
            >
              <div className="attachment-phone-content">
                <AttachmentDetails item={attachment} />
              </div>
            </PhoneSheet>
          )}
        </div>
      ) : message.voiceDurationMs === undefined ? (
        (!message.commerce || message.text) && (
          <p>
            <FormattedMessageText text={message.text} segments={message.formattedText} />
          </p>
        )
      ) : (
        <VoiceMessage durationMs={message.voiceDurationMs} />
      )}
      {message.interactive?.footer && (
        <div className="message-footer">{message.interactive.footer}</div>
      )}
    </MessageFrame>
  );
}
