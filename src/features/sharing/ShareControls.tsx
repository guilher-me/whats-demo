import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ControlIcon } from '../../components/icons/ControlIcon';
import { createShareURL } from '../../core/codec';
import type { Project } from '../../core/types';
import { useT } from '../../i18n';

async function writeLink(link: Promise<string>) {
  const clipboard = navigator.clipboard;
  // Start the write within the button gesture while the link is being compressed.
  if (clipboard?.write && typeof ClipboardItem === 'function') {
    await clipboard.write([
      new ClipboardItem({
        'text/plain': link.then((url) => new Blob([url], { type: 'text/plain' })),
      }),
    ]);
  } else {
    await clipboard.writeText(await link);
  }
}

export function ShareControls({
  project,
  disabled,
  hasErrors,
}: {
  project: Project;
  disabled: boolean;
  hasErrors: boolean;
}) {
  const t = useT();
  const pending = useRef(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();

  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = window.setTimeout(() => setNotice(undefined), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const copy = async () => {
    if (pending.current) return;
    if (hasErrors) {
      setNotice({ text: t('errors.pendingFields'), error: true });
      return;
    }

    pending.current = true;
    setNotice(undefined);
    const link = createShareURL(project, 'editor', location.href, undefined, 'preview');
    const [generated, copied] = await Promise.allSettled([link, writeLink(link)]);
    pending.current = false;
    if (generated.status === 'rejected')
      setNotice({ text: (generated.reason as Error).message, error: true });
    else if (copied.status === 'rejected') setNotice({ text: t('sharing.copyError'), error: true });
    else setNotice({ text: t('sharing.copied') });
  };

  return (
    <div className="share-control">
      <Button
        variant="primary"
        className="button-with-icon"
        disabled={disabled}
        onClick={() => void copy()}
      >
        <ControlIcon name="link" />
        {t('sharing.copy')}
      </Button>
      {notice && (
        <p className="share-notice" role={notice.error ? 'alert' : 'status'}>
          {notice.text}
        </p>
      )}
    </div>
  );
}
