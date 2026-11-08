const BAR_COUNT = 36;
const BAR_SPACING = 4;
const HEIGHT = 24;

function sampleVoice(time: number) {
  // A fixed envelope groups irregular peaks into syllables and leaves gaps between phrases.
  const syllable = 0.2 + 0.8 * Math.max(0, Math.sin(time * 0.024 + Math.sin(time * 0.008) * 0.8));
  const phrase = Math.max(0, Math.sin(time * 0.0023 + Math.sin(time * 0.0011)) + 0.35);
  const peak = 0.52 + 0.3 * Math.sin(time * 0.091) + 0.18 * Math.sin(time * 0.147);
  return 2 + 20 * syllable * Math.min(1, phrase) * peak;
}

export function VoiceWaveform({ milliseconds }: { milliseconds: number }) {
  return (
    <svg
      className="voice-waveform"
      viewBox={`0 0 ${BAR_COUNT * BAR_SPACING} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => {
        const height = sampleVoice((index / (BAR_COUNT - 1)) * milliseconds);
        return (
          <rect
            key={index}
            x={index * BAR_SPACING + 1}
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
