import { useT } from '../../i18n';
import { useState } from 'react';
import type { Project } from '../../core/types';
import { createURL } from '../../core/codec';
import { normalizeProject } from '../../core/project';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { TextArea } from '../../components/ui/Field';
import { ControlIcon } from '../../components/icons/ControlIcon';
export function ShareButton({
  project,
  disabled,
  onError,
}: {
  project: Project;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const t = useT();

  const [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false),
    [link, setLink] = useState(''),
    [open, setOpen] = useState(false);
  const share = async () => {
    setBusy(true);
    try {
      const url = await createURL(normalizeProject(project), location.href);
      let success = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          success = true;
        }
      } catch {
        /* The dialog is the accessible fallback. */
      }
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setLink(url);
        setOpen(true);
      }
      onError('');
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        variant="primary"
        className="share-button"
        disabled={disabled || busy}
        onClick={() => void share()}
      >
        <ControlIcon name="link" width="17" height="17" />
        {busy ? t('sharing.generating') : copied ? t('sharing.copied') : t('sharing.copy')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('sharing.title')}
        description={t('sharing.copyHint')}
      >
        <TextArea
          label={t('sharing.title')}
          value={link}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        {location.protocol === 'file:' && <p>{t('sharing.hostHint')}</p>}
      </Dialog>
    </>
  );
}
