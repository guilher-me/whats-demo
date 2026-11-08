import { useT } from '../../../i18n';
import { useId } from 'react';
import type { ExpressionContext, FlowComponent, Value } from '../../../core/types';
import { resolve, resolveOptions } from '../../../core/engine';
import { OptionGroup } from './OptionGroup';
interface Props {
  component: FlowComponent;
  context: ExpressionContext;
  onChange: (name: string, value: Value) => void;
}
export function FlowField({ component: c, context, onChange }: Props) {
  const t = useT();

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
    if (!Array.isArray(options))
      return (
        <p role="alert">
          {t('flow.invalidSourcePrefix')} {label}.
        </p>
      );
    if (c.type === 'Dropdown')
      return (
        <label className="flow-field" htmlFor={id}>
          <span id={`${id}-label`} className={value ? 'flow-field-label' : 'visually-hidden'}>
            {label}
          </span>
          <select
            id={id}
            className={value ? undefined : 'flow-select-empty'}
            aria-labelledby={`${id}-label`}
            data-field={name}
            aria-required={c.required || undefined}
            value={String(value ?? '')}
            onChange={(e) => change(e.target.value)}
          >
            <option value="">{label}</option>
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
        <input
          data-field={name}
          aria-required={c.required || undefined}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => change(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    );
  if (['TextInput', 'TextArea', 'DatePicker'].includes(c.type)) {
    const hint = c['helper-text'] ? String(resolve(c['helper-text'], context)) : '';
    const multiline = c.type === 'TextArea';
    const maxLength = multiline ? (c['max-length'] ?? c['max-chars']) : c['max-chars'];
    const common = {
      id,
      'data-field': name,
      'aria-required': c.required || undefined,
      value: String(value ?? ''),
      maxLength,
      'aria-labelledby': `${id}-label`,
      autoComplete: 'off',
      'aria-describedby': hint ? `${id}-hint` : undefined,
    };
    return (
      <label className={multiline ? 'flow-field flow-field--textarea' : 'flow-field'} htmlFor={id}>
        <span id={`${id}-label`} className="flow-field-label">
          {label}
        </span>
        {multiline ? (
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
        {multiline && maxLength !== undefined && (
          <small className="flow-count" aria-hidden="true">
            {common.value.length} / {maxLength}
          </small>
        )}
      </label>
    );
  }
  return c.type === 'Footer' ? null : (
    <p role="alert">
      {t('flow.unsupportedPrefix')} {c.type}.
    </p>
  );
}
