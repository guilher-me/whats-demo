import type { Option, Value } from '../../../core/types';
export function OptionGroup({
  name,
  label,
  options,
  multiple,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: Option[];
  multiple: boolean;
  value: Value;
  onChange: (value: Value) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <fieldset>
      <legend>{label}</legend>
      {options.map((option) => (
        <label key={option.id} className="flow-option">
          <span>{option.title}</span>
          <input
            data-field={name}
            data-option={option.id}
            type={multiple ? 'checkbox' : 'radio'}
            name={name}
            value={option.id}
            checked={multiple ? selected.includes(option.id) : value === option.id}
            onChange={(e) =>
              onChange(
                multiple
                  ? e.target.checked
                    ? [...selected, option.id]
                    : selected.filter((v) => v !== option.id)
                  : option.id,
              )
            }
          />
        </label>
      ))}
    </fieldset>
  );
}
