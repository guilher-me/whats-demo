import * as Menu from '@radix-ui/react-dropdown-menu';
import { useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ControlIcon } from '../../components/icons/ControlIcon';
import { Dialog } from '../../components/ui/Dialog';
import { TextField, FieldError } from '../../components/ui/Field';
import { useShareLink } from '../sharing/ShareControls';
import { useT } from '../../i18n';
import type { Journey } from './storage';

export const JOURNEY_TITLE_LIMIT = 80;

type Action = { kind: 'rename'; item: Journey; value: string } | { kind: 'delete'; item: Journey };

export function JourneyControls({
  active,
  items,
  disabled,
  onCreate,
  onOpen,
  onRename,
  onDelete,
}: {
  active: Journey;
  items: Journey[];
  disabled: boolean;
  onCreate: () => void;
  onOpen: (journey: Journey) => void;
  onRename: (journey: Journey, title: string) => Promise<boolean>;
  onDelete: (journey: Journey) => Promise<void>;
}) {
  const t = useT();
  const [action, setAction] = useState<Action>();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const { copy, notice } = useShareLink();
  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  const title = (item: Journey) => item.title.trim() || t('journeys.untitled');
  const openAction = (next: Action) => {
    setError('');
    setAction(next);
  };
  const closeAction = () => {
    setAction(undefined);
    window.requestAnimationFrame(() => trigger.current?.focus());
  };

  const submit = async (current: Action) => {
    setWorking(true);
    setError('');
    try {
      if (current.kind === 'delete') await onDelete(current.item);
      else if (!(await onRename(current.item, current.value.trim()))) {
        setError(t('journeys.renameFailed'));
        return;
      }
      closeAction();
    } catch {
      setError(t(current.kind === 'delete' ? 'journeys.deleteFailed' : 'journeys.renameFailed'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="journey-controls" role="group" aria-label={t('journeys.library')}>
      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            ref={trigger}
            type="button"
            className="button button-with-icon"
            disabled={disabled}
          >
            {t('journeys.library')}
            <ControlIcon name="chevron" />
          </button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content className="ui-menu journey-menu" align="start" sideOffset={6}>
            {notice && (
              <p className="journey-menu-note" role={notice.error ? 'alert' : 'status'}>
                {notice.text}
              </p>
            )}
            {sorted.length ? (
              <Menu.RadioGroup
                value={active.id}
                onValueChange={(id) => {
                  const item = items.find((journey) => journey.id === id);
                  if (item) onOpen(item);
                }}
              >
                {sorted.map((item) => (
                  <div key={item.id} className="journey-row" role="presentation">
                    <Menu.RadioItem value={item.id} className="ui-menu-item journey-item">
                      <Menu.ItemIndicator aria-hidden="true">✓</Menu.ItemIndicator>
                      <span>{title(item)}</span>
                    </Menu.RadioItem>
                    <Menu.Item
                      asChild
                      onSelect={(event) => {
                        event.preventDefault();
                        void copy(item.project, !!Object.keys(item.flows ?? {}).length);
                      }}
                    >
                      <button
                        type="button"
                        className="ui-menu-item journey-item-action"
                        aria-label={t('journeys.copyItem', { title: title(item) })}
                        title={t('sharing.copy')}
                      >
                        <ControlIcon name="link" />
                      </button>
                    </Menu.Item>
                    <Menu.Item
                      asChild
                      onSelect={() => openAction({ kind: 'rename', item, value: item.title })}
                    >
                      <button
                        type="button"
                        className="ui-menu-item journey-item-action"
                        aria-label={t('journeys.renameItem', { title: title(item) })}
                        title={t('journeys.rename')}
                      >
                        <ControlIcon name="pencil" />
                      </button>
                    </Menu.Item>
                    <Menu.Item asChild onSelect={() => openAction({ kind: 'delete', item })}>
                      <button
                        type="button"
                        className="ui-menu-item journey-item-action is-danger"
                        aria-label={t('journeys.deleteItem', { title: title(item) })}
                        title={t('journeys.delete')}
                      >
                        <ControlIcon name="trash" />
                      </button>
                    </Menu.Item>
                  </div>
                ))}
              </Menu.RadioGroup>
            ) : (
              <Menu.Label className="journey-menu-note">{t('journeys.empty')}</Menu.Label>
            )}
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
      <Button disabled={disabled} onClick={onCreate}>
        {t('journeys.new')}
      </Button>
      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !working) closeAction();
        }}
        title={t(action?.kind === 'delete' ? 'journeys.delete' : 'journeys.rename')}
        description={
          action?.kind === 'delete'
            ? t('journeys.deleteHint', { title: title(action.item) })
            : undefined
        }
      >
        {action && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!working) void submit(action);
            }}
          >
            {action.kind === 'rename' && (
              <TextField
                label={t('journeys.title')}
                value={action.value}
                disabled={working}
                maxLength={JOURNEY_TITLE_LIMIT}
                onChange={(event) => setAction({ ...action, value: event.currentTarget.value })}
              />
            )}
            <FieldError>{error}</FieldError>
            <div className="dialog-actions">
              <Button disabled={working} onClick={closeAction}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={working}
                variant={action.kind === 'delete' ? 'danger' : 'primary'}
              >
                {t(action.kind === 'delete' ? 'journeys.delete' : 'journeys.save')}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
