const SAMPLE_MS = 70;
const BAR_SPACING = 4;
const HEIGHT = 24;

function sampleVoice(time: number) {
  if (time < 0) return 2;
  // A fixed envelope groups irregular peaks into syllables and leaves gaps between phrases.
  const syllable = 0.2 + 0.8 * Math.max(0, Math.sin(time * 0.024 + Math.sin(time * 0.008) * 0.8));
  const phrase = Math.max(0, Math.sin(time * 0.0023 + Math.sin(time * 0.0011)) + 0.35);
  const peak = 0.52 + 0.3 * Math.sin(time * 0.091) + 0.18 * Math.sin(time * 0.147);
  return 2 + 20 * syllable * Math.min(1, phrase) * peak;
}

export function VoiceWaveform({
  milliseconds,
  recording = false,
}: {
  milliseconds: number;
  recording?: boolean;
}) {
  const count = recording ? 48 : 36;
  const samples = milliseconds / SAMPLE_MS;
  const newest = Math.floor(samples);
  const offset = recording ? (samples - newest) * BAR_SPACING : 0;

  return (
    <svg
      className="voice-waveform"
      viewBox={`0 0 ${count * BAR_SPACING} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: count + Number(recording) }, (_, index) => {
        const time = recording
          ? (newest - count + index) * SAMPLE_MS
          : (index / (count - 1)) * milliseconds;
        const height = sampleVoice(time);
        return (
          <rect
            key={index}
            x={index * BAR_SPACING + 1 - offset}
            y={(HEIGHT - height) / 2}
            width="2"
            height={height}
            rx="1"
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
