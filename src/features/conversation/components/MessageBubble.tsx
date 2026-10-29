import type { ChatMessage, FlowStep } from '../../../core/types';
import { FlowInvitation } from './FlowInvitation';
export function MessageBubble({
  message,
  running,
  onOpen,
}: {
  message: ChatMessage;
  running: boolean;
  onOpen: (step: FlowStep) => void;
}) {
  return (
    <div
      className={`bubble ${message.direction === 'user' ? 'user' : ''} ${message.flowStep ? 'flow-card' : ''}`}
    >
      <p>{message.text}</p>
      <small className="message-time">
        {message.time}
        {message.direction === 'user' && '  ✓✓'}
      </small>
      {message.flowStep && (
        <FlowInvitation
          step={message.flowStep}
          completed={!!message.completed}
          disabled={!running}
          onOpen={onOpen}
        />
      )}
    </div>
  );
}
