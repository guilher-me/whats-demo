import * as Menu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ControlIcon } from '../../components/icons/ControlIcon';
import { Dialog } from '../../components/ui/Dialog';
import { TextField } from '../../components/ui/Field';
import { useT } from '../../i18n';
import type { Journey } from './storage';

export const JOURNEY_TITLE_LIMIT = 80;

export function JourneyControls({
  active,
  items,
  disabled,
  onCreate,
  onOpen,
  onRename,
  onDuplicate,
}: {
  active: Journey;
  items: Journey[];
  disabled: boolean;
  onCreate: () => void;
  onOpen: (journey: Journey) => void;
  onRename: (title: string) => void;
  onDuplicate: (journey: Journey) => void;
}) {
  const t = useT();
  const [name, setName] = useState<string>();
  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeInLibrary = items.some((item) => item.id === active.id);
  return (
    <div className="journey-controls" role="group" aria-label={t('journeys.library')}>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button className="button-with-icon" disabled={disabled}>
            {t('journeys.library')}
            <ControlIcon name="chevron" />
          </Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content className="ui-menu journey-menu" align="start" sideOffset={6}>
            {sorted.length ? (
              <Menu.RadioGroup
                value={active.id}
                onValueChange={(id) => {
                  const item = items.find((journey) => journey.id === id);
                  if (item) onOpen(item);
                }}
              >
                {sorted.map((item) => (
                  <Menu.RadioItem
                    key={item.id}
                    value={item.id}
                    className="ui-menu-item journey-item"
                  >
                    <Menu.ItemIndicator aria-hidden="true">✓</Menu.ItemIndicator>
                    <span>{item.title.trim() || t('journeys.untitled')}</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            ) : (
              <Menu.Label className="journey-menu-note">{t('journeys.empty')}</Menu.Label>
            )}
            {activeInLibrary && (
              <>
                <Menu.Separator className="journey-menu-separator" />
                <Menu.Item className="ui-menu-item" onSelect={() => setName(active.title)}>
                  {t('journeys.rename')}
                </Menu.Item>
                <Menu.Item className="ui-menu-item" onSelect={() => onDuplicate(active)}>
                  {t('journeys.duplicate')}
                </Menu.Item>
              </>
            )}
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
      <Button disabled={disabled} onClick={onCreate}>
        {t('journeys.new')}
      </Button>
      <Dialog
        open={name !== undefined}
        onOpenChange={(open) => {
          if (!open) setName(undefined);
        }}
        title={t('journeys.rename')}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name !== undefined) onRename(name.trim());
            setName(undefined);
          }}
        >
          <TextField
            label={t('journeys.title')}
            value={name ?? ''}
            maxLength={JOURNEY_TITLE_LIMIT}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <div className="dialog-actions">
            <Button onClick={() => setName(undefined)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary">
              {t('journeys.save')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
