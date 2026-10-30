import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { TextArea, FieldError } from '../../components/ui/Field';
import { ControlIcon } from '../../components/icons/ControlIcon';
import type { SharedLink } from './useSharedLink';

export function LinkRecovery({ link, hasDraft }: { link: SharedLink; hasDraft: boolean }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [attempted, setAttempted] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (link.error) title.current?.focus();
  }, [link.error]);
  return (
    <main className="link-recovery" aria-labelledby="link-recovery-title">
      <section className="link-recovery-card" aria-busy={link.loading}>
        <span className="link-recovery-icon">
          <ControlIcon name="link" width="28" height="28" />
        </span>
        <h2 id="link-recovery-title" ref={title} tabIndex={-1}>
          {t(link.error ? 'link.failedTitle' : 'link.loadingTitle')}
        </h2>
        {link.error ? (
          <>
            <p role={editing ? undefined : 'alert'}>{t('link.failedHint')}</p>
            <p className="link-preserved">
              {t(hasDraft ? 'link.draftPreserved' : 'link.exampleAvailable')}
            </p>
            <details className="link-error-details">
              <summary>{t('link.details')}</summary>
              <p>{link.error}</p>
            </details>
            {editing ? (
              <form
                aria-label={t('link.pasteTitle')}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!link.loading && input.trim()) {
                    setAttempted(true);
                    void link.open(input);
                  }
                }}
              >
                <TextArea
                  label={t('link.urlLabel')}
                  value={input}
                  autoFocus
                  spellCheck={false}
                  aria-invalid={(attempted && !link.loading) || undefined}
                  aria-describedby={attempted && !link.loading ? 'link-retry-error' : undefined}
                  onChange={(event) => {
                    setInput(event.target.value);
                    setAttempted(false);
                  }}
                />
                {attempted && !link.loading && (
                  <FieldError id="link-retry-error">{t('link.retryFailed')}</FieldError>
                )}
                <Button type="submit" variant="primary" disabled={link.loading || !input.trim()}>
                  {t(link.loading ? 'link.loadingTitle' : 'link.open')}
                </Button>
              </form>
            ) : (
              <Button variant="primary" onClick={() => setEditing(true)}>
                {t('link.pasteTitle')}
              </Button>
            )}
          </>
        ) : (
          <p role="status">{t('link.loadingHint')}</p>
        )}
        <Button variant="ghost" onClick={link.dismiss}>
          {t(hasDraft ? 'link.continueDraft' : 'link.exploreExample')}
        </Button>
      </section>
    </main>
  );
}
