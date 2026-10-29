export type RecordingMode = 'manual' | 'automatic';
export type RecordingPhase = 'idle' | 'preparing' | 'countdown' | 'recording' | 'finishing';
export interface RecordedClip {
  blob: Blob;
  extension: 'mp4' | 'webm';
  width: number;
  height: number;
  durationMs: number;
}
export interface PhoneRecording {
  start: () => void;
  finish: () => Promise<RecordedClip>;
  cancel: () => void;
}
export const formatElapsed = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
