import type { BusinessInteractive, MessageStep } from '../../../core/types';
import { createInteractive, businessMessageError, messageOptions } from '../../../core/interactive';
import { TextField, FieldError } from '../../../components/ui/Field';
import { MessageTextEditor } from './MessageTextEditor';
import { SelectField } from '../../../components/ui/SelectField';
import { ReplyButtonsEditor } from './ReplyButtonsEditor';
import { ListMessageEditor } from './ListMessageEditor';
export function BusinessMessageEditor({
  step,
  onChange,
}: {
  step: MessageStep;
  onChange: (change: Partial<MessageStep>) => void;
}) {
  const value = step.interactive;
  const error = businessMessageError(step);
  const update = (next: BusinessInteractive) => {
    if (next.autoReplyId && !messageOptions(next).some((o) => o.id === next.autoReplyId))
      next = { ...next, autoReplyId: undefined };
    onChange({ interactive: next });
  };
  return (
    <>
      <SelectField
        label="Formato da mensagem"
        value={value?.kind ?? 'text'}
        onChange={(e) =>
          onChange({
            interactive:
              e.target.value === 'text'
                ? undefined
                : createInteractive(e.target.value as BusinessInteractive['kind']),
          })
        }
      >
        <option value="text">Texto simples</option>
        <option value="buttons">Botões de resposta</option>
        <option value="list">Lista de opções</option>
      </SelectField>
      <MessageTextEditor
        label="Texto da mensagem"
        value={step.text}
        maxLength={value ? 1024 : undefined}
        onChange={(text) => onChange({ text })}
      />
      {value && (
        <>
          {value.kind === 'buttons' ? (
            <ReplyButtonsEditor value={value} onChange={update} />
          ) : (
            <ListMessageEditor value={value} onChange={update} />
          )}
          <details className="message-settings">
            <summary>Cabeçalho, rodapé e resposta automática</summary>
            <TextField
              label="Cabeçalho (opcional)"
              value={value.header ?? ''}
              maxLength={60}
              onChange={(e) => update({ ...value, header: e.target.value })}
            />
            <TextField
              label="Rodapé (opcional)"
              value={value.footer ?? ''}
              maxLength={60}
              onChange={(e) => update({ ...value, footer: e.target.value })}
            />
            <SelectField
              label="Resposta no modo automático"
              value={value.autoReplyId ?? ''}
              onChange={(e) => update({ ...value, autoReplyId: e.target.value })}
            >
              <option value="">Primeira opção</option>
              {messageOptions(value).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title || 'Sem título'}
                </option>
              ))}
            </SelectField>
          </details>
          <FieldError>{error}</FieldError>
        </>
      )}
    </>
  );
}
