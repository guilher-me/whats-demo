import { VerifiedIcon, GhostVerifiedIcon } from '../icons/WhatsAppIcons';

/** A native checkbox with the same badge used in the conversation header. */
export function VerifiedBadgeCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="verified-badge-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="verified-badge-checkbox-icon" aria-hidden="true">
        {checked ? (
          <VerifiedIcon width="24" height="24" />
        ) : (
          <GhostVerifiedIcon width="24" height="24" />
        )}
      </span>
      <span>{label}</span>
    </label>
  );
}
