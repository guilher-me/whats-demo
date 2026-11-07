import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { loadSharedProject, sharedRoute } from '../core/codec';
import type { Project } from '../core/types';
import { i18n, initialLocale, useT } from '../i18n';
import { DemoApp } from './DemoApp';
import { EditorApp } from './EditorApp';

type SharedRoute = NonNullable<ReturnType<typeof sharedRoute>>;

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

function SharedExperience({ route }: { route: SharedRoute }) {
  const t = useT();
  const [result, setResult] = useState<{ project: Project } | { error: string }>();
  const { mode, legacy, token, locale, previewOnly } = route;
  useLayoutEffect(() => {
    if (!locale) return;
    void i18n.changeLanguage(locale);
    return () => {
      void i18n.changeLanguage(initialLocale());
    };
  }, [locale]);
  useEffect(() => {
    let active = true;
    void loadSharedProject({ legacy, token }).then(
      (project) => {
        if (active) setResult({ project });
      },
      (error) => {
        if (active) setResult({ error: (error as Error).message });
      },
    );
    return () => {
      active = false;
    };
  }, [legacy, token]);

  if (!result)
    return (
      <p className="link-loading" role="status">
        {t('errors.loading')}
      </p>
    );
  if ('error' in result)
    return (
      <main className="link-recovery">
        <section className="link-recovery-card" aria-labelledby="invalid-share-title">
          <h1 id="invalid-share-title">{t('sharing.invalidTitle')}</h1>
          <p role="alert">{result.error}</p>
          <p>{t('sharing.draftPreserved')}</p>
          <a className="button button--primary" href={location.pathname}>
            {t('sharing.openEditor')}
          </a>
        </section>
      </main>
    );
  return mode === 'editor' ? (
    <EditorApp copy={{ project: result.project, token }} previewOnly={previewOnly} />
  ) : (
    <DemoApp project={result.project} token={legacy ? undefined : token} locale={locale} />
  );
}

export function App() {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  const route = sharedRoute(hash);
  return route ? <SharedExperience key={hash} route={route} /> : <EditorApp />;
}
