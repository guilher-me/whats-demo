import { useRef, useState } from 'react';
import type { Project } from '../../core/types';
import { readDocument, downloadDocument } from '../../core/document';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useT } from '../../i18n';
export function FileControls({
  project,
  disabled,
  onImport,
}: {
  project: Project;
  disabled: boolean;
  onImport: (project: Project) => void;
}) {
  const t = useT(),
    input = useRef<HTMLInputElement>(null),
    request = useRef(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [incoming, setIncoming] = useState<Project | null>(null);
  const save = async () => {
    setError('');
    setBusy(true);
    try {
      await downloadDocument(project);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <input
        ref={input}
        hidden
        type="file"
        accept=".json,application/json"
        aria-label={t('files.import')}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const id = ++request.current;
          setBusy(true);
          setError('');
          try {
            const next = await readDocument(file);
            if (id === request.current) setIncoming(next);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            if (id === request.current) setBusy(false);
          }
        }}
      />
      <Button disabled={disabled || busy} onClick={() => input.current?.click()}>
        {t('files.import')}
      </Button>
      <Button variant="primary" disabled={disabled || busy} onClick={() => void save()}>
        {t('files.export')}
      </Button>
      {error && (
        <Dialog open title={t('files.error')} description={error} onOpenChange={() => setError('')}>
          <Button onClick={() => setError('')}>{t('common.close')}</Button>
        </Dialog>
      )}
      {incoming && (
        <Dialog
          open
          title={t('files.replace')}
          description={t('files.hint', { v0: project.contact.name, v1: incoming.contact.name })}
          onOpenChange={(open) => {
            if (!open) setIncoming(null);
          }}
        >
          <div className="dialog-actions">
            <Button disabled={busy} onClick={() => void save()}>
              {t('files.backup')}
            </Button>
            <Button onClick={() => setIncoming(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={disabled || busy}
              onClick={() => {
                onImport(incoming);
                setIncoming(null);
              }}
            >
              {t('files.replace')}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
