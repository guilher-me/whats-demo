import { useT } from '../../../i18n';
import { ActionMenu } from '../../../components/ui/ActionMenu';
export type StepAction = 'up' | 'down' | 'copy' | 'delete';
export function StepActions({
  first,
  last,
  onAction,
}: {
  first: boolean;
  last: boolean;
  onAction: (action: StepAction) => void;
}) {
  const t = useT();

  return (
    <ActionMenu
      label={t('editor.actions')}
      items={[
        { label: t('editor.duplicate'), icon: 'copy', onSelect: () => onAction('copy') },
        { label: t('editor.up'), icon: 'up', disabled: first, onSelect: () => onAction('up') },
        { label: t('editor.down'), icon: 'down', disabled: last, onSelect: () => onAction('down') },
        {
          label: t('editor.remove'),
          icon: 'trash',
          danger: true,
          onSelect: () => onAction('delete'),
        },
      ]}
    />
  );
}
