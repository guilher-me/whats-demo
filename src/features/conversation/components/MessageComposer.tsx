import { useT } from '../../../i18n';
import { AddIcon, SmileyIcon, SendIcon } from '../../../components/icons/WhatsAppIcons';
export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <form
      className="composer"
      aria-label={t('phone.composer')}
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && value.trim()) onSend();
      }}
    >
      <div className="composer-icons" aria-hidden="true">
        <AddIcon />
        <SmileyIcon />
      </div>
      <input
        data-composer-input
        aria-label={t('phone.message')}
        placeholder={t('phone.message')}
        maxLength={2000}
        autoComplete="off"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        data-send
        aria-label={t('phone.send')}
        disabled={disabled || !value.trim()}
      >
        <SendIcon />
      </button>
    </form>
  );
}
