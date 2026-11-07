import { useT } from '../../../i18n';
import { MicrophoneIcon, SendIcon } from '../../../components/icons/WhatsAppIcons';
import { ComposerField } from './ComposerField';
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
  const empty = !value.trim();

  return (
    <form
      className="composer"
      aria-label={t('phone.composer')}
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && value.trim()) onSend();
      }}
    >
      <ComposerField empty={empty}>
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
      </ComposerField>
      <button
        type="submit"
        data-send
        className="composer-action"
        aria-label={t('phone.send')}
        disabled={disabled || empty}
      >
        {empty ? <MicrophoneIcon /> : <SendIcon />}
      </button>
    </form>
  );
}
