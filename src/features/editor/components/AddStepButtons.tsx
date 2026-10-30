import { useT } from '../../../i18n';
import type { Step } from '../../../core/types';
import { Button } from '../../../components/ui/Button';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function AddStepButtons({
  onAdd,
  disabled,
}: {
  onAdd: (type: Step['type']) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const entries = [
    { type: 'user', name: t('editor.customer'), detail: t('editor.incoming'), icon: 'user' },
    {
      type: 'business',
      name: t('editor.business'),
      detail: t('editor.businessDetail'),
      icon: 'message',
    },
    { type: 'flow', name: 'Flow', detail: t('editor.formDetail'), icon: 'flow' },
  ] as const;

  return (
    <div className="component-palette">
      <div className="control-caption">
        <span>{t('editor.addHeading')}</span>
      </div>
      <div className="add-row" role="group" aria-label={t('editor.addRegion')}>
        {entries.map((entry) => (
          <Button
            key={entry.type}
            aria-label={`＋ ${entry.name}`}
            title={entry.detail}
            disabled={disabled}
            onClick={() => onAdd(entry.type)}
          >
            <span className="palette-icon">
              <ControlIcon name={entry.icon} />
            </span>
            <span>
              <span>{entry.name}</span>
            </span>
            <span className="palette-plus" aria-hidden="true">
              ＋
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
