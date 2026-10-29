import type { ChatMessage, FlowStep } from '../../../core/types';
import { FlowInvitation } from './FlowInvitation';
import { ReplyButtons } from './ReplyButtons';
import { ListInvitation } from './ListInvitation';
export function BusinessMessageActions({
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
  if (message.flowStep)
    return (
      <FlowInvitation
        step={message.flowStep}
        completed={!!message.completed}
        disabled={!running}
        onOpen={onOpen}
      />
    );
  const value = message.interactive;
  const disabled = !running || pendingId !== message.id;
  if (value?.kind === 'buttons')
    return (
      <ReplyButtons
        options={value.buttons}
        selected={message.selection}
        disabled={disabled}
        onSelect={(id) => onReply(message.id, id)}
      />
    );
  if (value?.kind === 'list')
    return (
      <ListInvitation label={value.button} disabled={disabled} onOpen={() => onList(message.id)} />
    );
  return null;
}
