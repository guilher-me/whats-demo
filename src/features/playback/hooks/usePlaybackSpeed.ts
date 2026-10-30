import { useCallback, useRef, useState } from 'react';

export const PLAYBACK_SPEED_KEY = 'whatsdemo-playback-speed';
export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2, 3] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export function isPlaybackSpeed(value: number): value is PlaybackSpeed {
  return PLAYBACK_SPEEDS.includes(value as PlaybackSpeed);
}
function initialSpeed(): PlaybackSpeed {
  try {
    const saved = Number(localStorage.getItem(PLAYBACK_SPEED_KEY));
    return isPlaybackSpeed(saved) ? saved : 1;
  } catch {
    return 1;
  }
}
export function usePlaybackSpeed() {
  const [speed, setState] = useState(initialSpeed);
  const current = useRef(speed);
  const setSpeed = useCallback((value: number) => {
    if (!isPlaybackSpeed(value)) return;
    current.current = value;
    setState(value);
    try {
      localStorage.setItem(PLAYBACK_SPEED_KEY, String(value));
    } catch {
      // The control still works if browser storage is unavailable.
    }
  }, []);
  return { speed, current, setSpeed };
}
