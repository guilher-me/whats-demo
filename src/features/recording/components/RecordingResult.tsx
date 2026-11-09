import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useT } from '../../../i18n';
import { createRecordingGif } from '../gif';
import type { RecordedClip } from '../types';

export function RecordingResult({
  clip,
  onDiscard,
  onAgain,
}: {
  clip: RecordedClip & { url: string };
  onDiscard: () => void;
  onAgain: () => void;
}) {
  const t = useT();
  const [filename] = useState(() => 'whats-demo-' + new Date().toISOString().replace(/[:.]/g, '-'));
  const [gifUrl, setGifUrl] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const exportJob = useRef<AbortController | null>(null);

  useEffect(() => {
    if (gifUrl) return () => URL.revokeObjectURL(gifUrl);
  }, [gifUrl]);
  useEffect(() => () => exportJob.current?.abort(), []);

  async function downloadGif() {
    if (exportJob.current) return;
    const job = new AbortController();
    exportJob.current = job;
    setProgress(0);
    setError(false);
    try {
      const blob = await createRecordingGif(clip, job.signal, setProgress);
      if (job.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      setGifUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename + '.gif';
      link.click();
    } catch {
      if (!job.signal.aborted) setError(true);
    } finally {
      exportJob.current = null;
      if (!job.signal.aborted) setProgress(null);
    }
  }

  return (
    <>
      <video
        className={'recorded-video' + (clip.transparent ? ' is-transparent' : '')}
        controls
        muted
        playsInline
        preload="metadata"
        src={clip.url}
        aria-label={t('recording.videoLabel')}
      />
      {progress !== null && (
        <div className="record-gif-progress">
          <span role="status">{t('recording.preparingGif')}</span>
          <progress aria-label={t('recording.preparingGif')} value={progress} max={100} />
        </div>
      )}
      {error && <p role="alert">{t('recording.gifError')}</p>}
      <div className="dialog-actions recording-result-actions">
        <Button onClick={onDiscard}>{t('recording.discard')}</Button>
        <Button onClick={onAgain}>{t('recording.again')}</Button>
        <a
          className="download-recording"
          href={clip.url}
          download={filename + '.' + clip.extension}
        >
          {t('recording.download')}
        </a>
        {gifUrl ? (
          <a className="download-recording" href={gifUrl} download={filename + '.gif'}>
            {t('recording.downloadGif')}
          </a>
        ) : (
          <Button variant="primary" disabled={progress !== null} onClick={() => void downloadGif()}>
            {t('recording.downloadGif')}
          </Button>
        )}
      </div>
    </>
  );
}
