import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { currentLocale, useT, type Locale } from '../i18n';
import type { Project } from '../core/types';
import { createShareURL, shareHash } from '../core/codec';
import { Button } from '../components/ui/Button';
import { JourneyPhone } from '../features/conversation/components/JourneyPhone';
import { PlaybackControls } from '../features/playback/components/PlaybackControls';
import { PlaybackSpeedControl } from '../features/playback/components/PlaybackSpeedControl';
import { usePlayback } from '../features/playback/hooks/usePlayback';
import { journeyDiagnostics } from '../features/flows/diagnostics';

export function DemoApp({
  project,
  token,
  locale,
}: {
  project: Project;
  token?: string;
  locale?: Locale;
}) {
  const t = useT();
  const phoneRef = useRef<HTMLDivElement>(null);
  const playback = usePlayback(phoneRef, false);
  const [error, setError] = useState('');
  const diagnostics = useMemo(() => journeyDiagnostics(project), [project, currentLocale()]);
  const automaticIssue = diagnostics.find((issue) => issue.kind === 'automatic');
  const run = (automatic: boolean) => void playback.run(project, automatic);
  const editLegacy = async () => {
    try {
      location.hash = new URL(await createShareURL(project, 'editor', location.href)).hash;
    } catch (failure) {
      setError((failure as Error).message);
    }
  };
  return (
    <main className="shared-demo" aria-label={t('sharing.preview')}>
      <header className="shared-demo-header">
        <h1>WhatsDemo</h1>
        {token ? (
          <a className="button" href={shareHash('editor', token, locale)}>
            {t('sharing.editCopy')}
          </a>
        ) : (
          <Button onClick={() => void editLegacy()}>{t('sharing.editCopy')}</Button>
        )}
      </header>
      {error && <p role="alert">{error}</p>}
      {automaticIssue && <p className="demo-flow-issue">{automaticIssue.message}</p>}
      <p className="play-status" role="status" aria-live="polite">
        {playback.status}
      </p>
      <div
        className="phone-stage"
        style={{ '--cursor-speed': playback.cursorSpeed } as CSSProperties}
      >
        <JourneyPhone
          project={project}
          playback={playback}
          phoneRef={phoneRef}
          disabled={false}
          onSend={() => playback.sendOrStart(project)}
          onStart={() => run(false)}
        />
        <div className="phone-tools">
          <PlaybackControls
            disabled={false}
            autoDisabled={!!automaticIssue}
            running={playback.running}
            paused={playback.paused}
            onManual={() => run(false)}
            onAuto={() => run(true)}
            onPause={playback.pause}
            onResume={playback.resume}
            onReset={playback.reset}
          />
          <PlaybackSpeedControl
            speed={playback.speed}
            onChange={playback.setSpeed}
            disabled={playback.paused}
          />
        </div>
      </div>
      <p className="preview-note">{t('app.local')}</p>
    </main>
  );
}
