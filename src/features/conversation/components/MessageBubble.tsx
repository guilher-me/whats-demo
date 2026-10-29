import type { ChatMessage, FlowStep } from '../../../core/types';
import { MessageFrame } from './MessageFrame';
import { BusinessMessageActions } from './BusinessMessageActions';
import { FormattedMessageText } from './FormattedMessageText';
export function MessageBubble({
  message,
  running,
  pendingId,
  onOpen,
  onReply,
  onList,
}: {
  message: ChatMessage;
  running: boolean;
  pendingId: string | null;
  onOpen: (step: FlowStep) => void;
  onReply: (messageId: string, optionId: string) => void;
  onList: (messageId: string) => void;
}) {
  return (
    <MessageFrame
      id={message.id}
      direction={message.direction}
      time={message.time}
      receipt={message.receipt}
      interactive={!!message.flowStep || !!message.interactive}
      actions={
        <BusinessMessageActions
          message={message}
          running={running}
          pendingId={pendingId}
          onOpen={onOpen}
          onReply={onReply}
          onList={onList}
        />
      }
    >
      {message.interactive?.header && (
        <div className="message-header">{message.interactive.header}</div>
      )}
      <p>
        <FormattedMessageText text={message.text} />
      </p>
      {message.interactive?.footer && (
        <div className="message-footer">{message.interactive.footer}</div>
      )}
    </MessageFrame>
  );
}
