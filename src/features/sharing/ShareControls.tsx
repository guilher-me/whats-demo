import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { ActionMenu } from '../../components/ui/ActionMenu';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FieldError } from '../../components/ui/Field';
import { createShareURL, MAX_SHARE_BYTES, type ShareMode } from '../../core/codec';
import type { Project } from '../../core/types';
import { useT } from '../../i18n';

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
  const [dialog, setDialog] = useState<ShareMode | 'ai'>();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const result = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  const generate = async (mode: ShareMode, candidate: () => unknown) => {
    const id = ++request.current;
    setBusy(true);
    setError('');
    setStatus('');
    setUrl('');
    try {
      const next = await createShareURL(candidate(), mode, location.href);
      if (id === request.current) setUrl(next);
    } catch (failure) {
      if (id === request.current) setError((failure as Error).message);
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  const openShare = (mode: ShareMode) => {
    returnFocus.current = menuTrigger.current;
    setDialog(mode);
    void generate(mode, () => {
      if (hasErrors) throw new Error(t('errors.pendingFields'));
      return project;
    });
  };
  const clearResult = () => {
    ++request.current;
    setBusy(false);
    setUrl('');
    setError('');
    setStatus('');
  };
  const openAI = (event: MouseEvent<HTMLButtonElement>) => {
    returnFocus.current = event.currentTarget;
    clearResult();
    setInput('');
    setDialog('ai');
  };
  const generateFromAI = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mode = new FormData(event.currentTarget).get('mode') === 'editor' ? 'editor' : 'demo';
    void generate(mode, () => {
      try {
        return JSON.parse(input) as unknown;
      } catch {
        throw new Error(t('sharing.invalidJSON'));
      }
    });
  };
  const copy = async () => {
    const id = request.current;
    try {
      await navigator.clipboard.writeText(url);
      if (id === request.current) setStatus(t('sharing.copied'));
    } catch {
      if (id !== request.current) return;
      result.current?.focus();
      result.current?.select();
      setStatus(t('sharing.copyFallback'));
    }
  };

  return (
    <>
      <Button onClick={openAI} disabled={disabled}>
        {t('sharing.createWithAI')}
      </Button>
      <ActionMenu
        label={t('sharing.copy')}
        icon="link"
        showLabel
        triggerRef={menuTrigger}
        disabled={disabled}
        items={[
          { label: t('sharing.demo'), icon: 'play', onSelect: () => openShare('demo') },
          { label: t('sharing.editor'), icon: 'pencil', onSelect: () => openShare('editor') },
        ]}
      />
      {dialog && (
        <Dialog
          open
          title={t(
            dialog === 'ai'
              ? 'sharing.createWithAI'
              : dialog === 'demo'
                ? 'sharing.demo'
                : 'sharing.editor',
          )}
          description={t(dialog === 'ai' ? 'sharing.aiHint' : 'sharing.privacy')}
          onReturnFocus={() => returnFocus.current?.focus()}
          onOpenChange={(open) => {
            if (open) return;
            ++request.current;
            setBusy(false);
            setDialog(undefined);
          }}
        >
          {dialog === 'ai' && (
            <form className="share-form" onSubmit={generateFromAI}>
              <label>
                <span>{t('sharing.configuration')}</span>
                <textarea
                  rows={5}
                  required
                  maxLength={MAX_SHARE_BYTES}
                  value={input}
                  onChange={(event) => {
                    clearResult();
                    setInput(event.currentTarget.value);
                  }}
                />
              </label>
              <label>
                <span>{t('sharing.mode')}</span>
                <select name="mode" onChange={clearResult}>
                  <option value="demo">{t('sharing.demo')}</option>
                  <option value="editor">{t('sharing.editor')}</option>
                </select>
              </label>
              <Button type="submit" variant="primary" disabled={busy}>
                {t('sharing.generate')}
              </Button>
            </form>
          )}
          {busy && <p role="status">{t('errors.loading')}</p>}
          <FieldError>{error}</FieldError>
          {url && (
            <div className="share-result">
              {dialog === 'ai' && <p>{t('sharing.privacy')}</p>}
              <label className="field">
                <span>{t('sharing.link')}</span>
                <input ref={result} value={url} readOnly />
              </label>
              <div className="dialog-actions">
                <a className="button" href={url} target="_blank" rel="noopener noreferrer">
                  {t('sharing.openLink')}
                </a>
                <Button variant="primary" onClick={() => void copy()}>
                  {t('sharing.copy')}
                </Button>
              </div>
              {status && <p role="status">{status}</p>}
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
