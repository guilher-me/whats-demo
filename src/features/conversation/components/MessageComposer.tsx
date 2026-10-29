import { useT } from '../../../i18n';
import { AddIcon, SmileyIcon, SendIcon } from '../../../components/icons/WhatsAppIcons';
export function MessageComposer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  const t = useT();

  return (
    <form
      className="composer"
      aria-label={t('phone.composer')}
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" data-send aria-label={t('phone.send')} disabled={!value.trim()}>
        <SendIcon />
      </button>
    </form>
  );
}
