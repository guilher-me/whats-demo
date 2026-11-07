import { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon } from '../../../components/icons/WhatsAppIcons';
import { formatVoiceTime } from '../../../core/voice-message';
import { useT } from '../../../i18n';
import { VoiceWaveform } from './VoiceWaveform';
import { ComposerField } from './ComposerField';

function RecordingWaveform({ elapsed, paused }: { elapsed: () => number; paused: boolean }) {
  const [milliseconds, setMilliseconds] = useState(elapsed);
  useEffect(() => {
    const update = () => setMilliseconds(elapsed());
    update();
    if (paused) return;
    const timer = setInterval(update, 40);
    return () => clearInterval(timer);
  }, [elapsed, paused]);

  return (
    <div className="composer-field voice-recording">
      <span className="voice-recording-dot" aria-hidden="true" />
      <span className="voice-duration" aria-hidden="true">
        {formatVoiceTime(milliseconds)}
      </span>
      <VoiceWaveform milliseconds={milliseconds} recording />
    </div>
  );
}

export function VoiceComposer({
  recording,
  paused,
  disabled,
  elapsed,
  onBegin,
  onSend,
  onCancel,
}: {
  recording: boolean;
  paused: boolean;
  disabled: boolean;
  elapsed: () => number;
  onBegin: () => boolean;
  onSend: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const held = useRef<{ pointerId: number; startX: number } | { key: string } | null>(null);
  useEffect(() => {
    if (!recording) held.current = null;
  }, [recording]);
  const release = (send: boolean) => {
    if (!held.current) return;
    held.current = null;
    if (send) onSend();
    else onCancel();
  };
  const releasePointer = (pointerId: number, send: boolean) => {
    const press = held.current;
    if (press && 'pointerId' in press && press.pointerId === pointerId) release(send);
  };

  return (
    <div className="composer">
      {recording ? (
        <RecordingWaveform elapsed={elapsed} paused={paused} />
      ) : (
        <ComposerField empty>
          <span className="composer-placeholder" aria-hidden="true">
            {t('phone.message')}
          </span>
        </ComposerField>
      )}
      <button
        type="button"
        data-voice-mic
        aria-label={t('phone.voiceHold')}
        title={t('phone.voiceHold')}
        className={`composer-action voice-mic${recording ? ' is-recording' : ''}`}
        disabled={disabled}
        onPointerDown={(event) => {
          if (event.button !== 0 || held.current || !onBegin()) return;
          held.current = { pointerId: event.pointerId, startX: event.clientX };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const press = held.current;
          if (
            press &&
            'pointerId' in press &&
            press.pointerId === event.pointerId &&
            press.startX - event.clientX >= 80
          )
            release(false);
        }}
        onPointerUp={(event) => releasePointer(event.pointerId, true)}
        onPointerCancel={(event) => releasePointer(event.pointerId, false)}
        onLostPointerCapture={(event) => releasePointer(event.pointerId, false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') release(false);
          if (event.key !== ' ' && event.key !== 'Enter') return;
          event.preventDefault();
          if (!event.repeat && !held.current && onBegin()) held.current = { key: event.key };
        }}
        onKeyUp={(event) => {
          if (held.current && 'key' in held.current && held.current.key === event.key) {
            event.preventDefault();
            release(true);
          }
        }}
        onBlur={() => release(false)}
        onContextMenu={(event) => event.preventDefault()}
      >
        <MicrophoneIcon />
      </button>
    </div>
  );
}
