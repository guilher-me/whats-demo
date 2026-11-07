export const DEFAULT_VOICE_SECONDS = 5;
export const MAX_VOICE_SECONDS = 120;

export function formatVoiceTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
