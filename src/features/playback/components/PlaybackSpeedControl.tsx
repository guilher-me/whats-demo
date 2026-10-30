import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '../../../i18n';
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from '../hooks/usePlaybackSpeed';

export function PlaybackSpeedControl({
  speed,
  onChange,
  disabled,
}: {
  speed: PlaybackSpeed;
  onChange: (speed: number) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return (
    <div
      className="playback-speed"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        type="button"
        ref={trigger}
        disabled={disabled}
        aria-label={t('playback.speed')}
        aria-expanded={open && !disabled}
        aria-controls={id}
        title={t('playback.speed')}
        onClick={() => setOpen(!open)}
      >
        {speed}×
      </button>
      {open && !disabled && (
        <div id={id} className="speed-panel" role="group" aria-label={t('playback.speed')}>
          <label htmlFor={`${id}-range`}>
            {t('playback.speed')} <output>{speed}×</output>
          </label>
          <input
            id={`${id}-range`}
            type="range"
            min="0"
            max="4"
            step="1"
            value={PLAYBACK_SPEEDS.indexOf(speed)}
            aria-valuetext={`${speed}×`}
            aria-describedby={`${id}-hint`}
            onChange={(event) => onChange(PLAYBACK_SPEEDS[Number(event.target.value)])}
          />
          <div className="speed-ticks" aria-hidden="true">
            {PLAYBACK_SPEEDS.map((value) => (
              <span key={value}>{value}×</span>
            ))}
          </div>
          <p id={`${id}-hint`}>{t('playback.speedHint')}</p>
        </div>
      )}
    </div>
  );
}
