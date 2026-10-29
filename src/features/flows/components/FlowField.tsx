import { useId } from 'react';
import type { ExpressionContext, FlowComponent, Option, Value } from '../../../core/types';
import { resolve, resolveOptions } from '../../../core/engine';
import { OptionGroup } from './OptionGroup';
interface Props {
  component: FlowComponent;
  context: ExpressionContext;
  onChange: (name: string, value: Value) => void;
}
export function FlowField({ component: c, context, onChange }: Props) {
  const id = useId(),
    name = c.name ?? '',
    label = String(resolve(c.label, context) ?? name),
    value = context.form[name];
  const change = (next: Value) => onChange(name, next);
  if (['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption'].includes(c.type)) {
    const text = String(resolve(c.text, context) ?? '');
    if (c.type === 'TextHeading') return <h2>{text}</h2>;
    if (c.type === 'TextSubheading') return <h3>{text}</h3>;
    return <p className={c.type === 'TextCaption' ? 'flow-caption' : undefined}>{text}</p>;
  }
  if (['RadioButtonsGroup', 'CheckboxGroup', 'Dropdown'].includes(c.type)) {
    const options = resolveOptions(c['data-source'], context);
    if (!Array.isArray(options)) return <p role="alert">data-source inválido em {label}.</p>;
    if (c.type === 'Dropdown')
      return (
        <label className="flow-field" htmlFor={id}>
          {label}
          <select
            id={id}
            data-field={name}
            aria-required={c.required || undefined}
            value={String(value ?? '')}
            onChange={(e) => change(e.target.value)}
          >
            <option value="">Selecione uma opção</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
      );
    return (
      <OptionGroup
        name={name}
        label={label}
        options={options}
        multiple={c.type === 'CheckboxGroup'}
        required={c.required}
        value={value}
        onChange={change}
      />
    );
  }
  if (c.type === 'OptIn')
    return (
      <label className="flow-option flow-optin">
        <span>{label}</span>
        <input
          data-field={name}
          aria-required={c.required || undefined}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => change(e.target.checked)}
        />
      </label>
    );
  if (['TextInput', 'TextArea', 'DatePicker'].includes(c.type)) {
    const hint = c['helper-text'] ? String(resolve(c['helper-text'], context)) : '';
    const common = {
      id,
      'data-field': name,
      'aria-required': c.required || undefined,
      value: String(value ?? ''),
      maxLength: c['max-chars'],
      autoComplete: 'off',
      'aria-describedby': hint ? `${id}-hint` : undefined,
    };
    return (
      <label className="flow-field" htmlFor={id}>
        {label}
        {c.type === 'TextArea' ? (
          <textarea {...common} onChange={(e) => change(e.target.value)} />
        ) : (
          <input
            {...common}
            type={c.type === 'DatePicker' ? 'date' : c['input-type'] === 'email' ? 'email' : 'text'}
            inputMode={c['input-type'] === 'number' ? 'numeric' : undefined}
            onChange={(e) => change(e.target.value)}
          />
        )}
        {hint && <small id={`${id}-hint`}>{hint}</small>}
      </label>
    );
  }
  return c.type === 'Footer' ? null : <p role="alert">Componente ainda não suportado: {c.type}.</p>;
}
