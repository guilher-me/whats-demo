import { MessageButtonIcon } from '../../../components/icons/MessageButtonIcon';
import { MessageAction } from './MessageAction';
export function ListInvitation({
  label,
  disabled,
  onOpen,
}: {
  label: string;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="message-actions">
      <MessageAction data-open-list disabled={disabled} onClick={onOpen}>
        <span className="message-button-content">
          <MessageButtonIcon type="list" />
          <span>{label}</span>
        </span>
      </MessageAction>
    </div>
  );
}
