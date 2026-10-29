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
  return (
    <form
      className="composer"
      aria-label="Enviar mensagem do cliente"
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
        aria-label="Mensagem"
        placeholder="Mensagem"
        maxLength={2000}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" data-send aria-label="Enviar mensagem" disabled={!value.trim()}>
        <SendIcon />
      </button>
    </form>
  );
}
