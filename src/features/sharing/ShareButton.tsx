import { useT } from '../../i18n';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../core/types';
import { createURL } from '../../core/codec';
import { normalizeProject } from '../../core/project';
import { Button, type ButtonProps } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { TextArea } from '../../components/ui/Field';
import { ControlIcon } from '../../components/icons/ControlIcon';
export function ShareButton({
  project,
  disabled,
  onError,
  label,
  allowDrafts = false,
  variant = 'primary',
}: {
  project: Project;
  disabled?: boolean;
  label?: string;
  allowDrafts?: boolean;
  variant?: ButtonProps['variant'];
  onError: (message: string) => void;
}) {
  const t = useT();
  const mounted = useRef(true);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(copiedTimer.current);
    };
  }, []);

  const [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false),
    [link, setLink] = useState(''),
    [open, setOpen] = useState(false);
  const share = async () => {
    clearTimeout(copiedTimer.current);
    setBusy(true);
    try {
      const url = await createURL(normalizeProject(project, { allowDrafts }), location.href);
      let success = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          success = true;
        }
      } catch {
        /* The dialog is the accessible fallback. */
      }
      if (!mounted.current) return;
      if (success) {
        setCopied(true);
        copiedTimer.current = setTimeout(() => setCopied(false), 2500);
      } else {
        setLink(url);
        setOpen(true);
      }
      onError('');
    } catch (error) {
      if (mounted.current) onError((error as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <>
      <Button
        variant={variant}
        className="share-button"
        disabled={disabled || busy}
        onClick={() => void share()}
      >
        <ControlIcon name="link" width="17" height="17" />
        {busy
          ? t('sharing.generating')
          : copied
            ? t('sharing.copied')
            : (label ?? t('sharing.copy'))}
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
