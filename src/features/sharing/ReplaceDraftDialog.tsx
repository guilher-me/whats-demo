import { useState } from 'react';
import { useT } from '../../i18n';
import type { Project } from '../../core/types';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { FieldError } from '../../components/ui/Field';
import { ShareButton } from './ShareButton';

export function ReplaceDraftDialog({
  current,
  incoming,
  onCancel,
  onConfirm,
}: {
  current: Project;
  incoming: Project;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const [copyError, setCopyError] = useState('');
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={t('link.replaceTitle')}
      description={t('link.replaceHint')}
    >
      <dl className="link-replacement-summary">
        <div>
          <dt>{t('link.current')}</dt>
          <dd>{current.contact.name || t('common.untitled')}</dd>
        </div>
        <div>
          <dt>{t('link.incoming')}</dt>
          <dd>{incoming.contact.name || t('common.untitled')}</dd>
        </div>
      </dl>
      <ShareButton
        project={current}
        allowDrafts
        variant="default"
        label={t('link.copyCurrent')}
        onError={setCopyError}
      />
      <FieldError>{copyError}</FieldError>
      <div className="dialog-actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="primary" onClick={onConfirm}>
          {t('link.replace')}
        </Button>
      </div>
    </Dialog>
  );
}
