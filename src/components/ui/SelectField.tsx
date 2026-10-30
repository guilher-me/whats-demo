import { useId } from 'react';
import * as Select from '@radix-ui/react-select';
import { ControlIcon } from '../icons/ControlIcon';
export function SelectField({
  label,
  value,
  onValueChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="field custom-select">
      <label htmlFor={id} id={`${id}-label`}>
        {label}
      </label>
      <Select.Root
        value={String(options.findIndex((option) => option.value === value))}
        onValueChange={(index) => onValueChange(options[Number(index)].value)}
        disabled={disabled}
      >
        <Select.Trigger id={id} aria-labelledby={`${id}-label`} className="ui-select-trigger">
          <Select.Value />
          <Select.Icon>
            <ControlIcon name="chevron" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="ui-select-content"
            position="popper"
            sideOffset={5}
            collisionPadding={12}
          >
            <Select.Viewport>
              {options.map((option, index) => (
                <Select.Item key={option.value} value={String(index)} className="ui-select-item">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <ControlIcon name="check" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
