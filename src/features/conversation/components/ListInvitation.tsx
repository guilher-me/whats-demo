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
        <span aria-hidden="true">☷</span> {label}
      </MessageAction>
    </div>
  );
}
