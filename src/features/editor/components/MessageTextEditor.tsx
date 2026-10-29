import { useId } from 'react';
import { TextArea } from '../../../components/ui/Field';
export function MessageTextEditor({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
}) {
  const hint = useId();
  return (
    <div className="message-text-editor">
      <TextArea
        label={label}
        value={value}
        maxLength={maxLength}
        aria-describedby={hint}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="formatting-hint" id={hint}>
        Formatação: *negrito* · _itálico_ · ~tachado~
      </p>
    </div>
  );
}
