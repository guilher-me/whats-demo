import * as Menu from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';
import { ControlIcon } from '../icons/ControlIcon';

export interface MenuAction {
  label: string;
  icon?: ComponentProps<typeof ControlIcon>['name'];
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}
/** Radix handles focus, Escape, arrow keys and collision-aware positioning. */
export function ActionMenu({
  label,
  items,
  icon = 'more',
}: {
  label: string;
  items: MenuAction[];
  icon?: ComponentProps<typeof ControlIcon>['name'];
}) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button
          type="button"
          className="ui-icon-button"
          data-editor-action
          aria-label={label}
          title={label}
        >
          <ControlIcon name={icon} />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className="ui-menu"
          sideOffset={6}
          align="end"
          collisionPadding={12}
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            <Menu.Item
              key={index}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={`ui-menu-item${item.danger ? ' is-danger' : ''}`}
            >
              {item.icon && <ControlIcon name={item.icon} />}
              <span>{item.label}</span>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
