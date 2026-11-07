import { ControlIcon } from '../../../components/icons/ControlIcon';
import { MicrophoneIcon } from '../../../components/icons/WhatsAppIcons';
import { formatVoiceTime } from '../../../core/voice-message';
import { useT } from '../../../i18n';
import { VoiceWaveform } from './VoiceWaveform';

export function VoiceMessage({ durationMs }: { durationMs: number }) {
  const t = useT();
  const duration = formatVoiceTime(durationMs);

  return (
    <div
      className="voice-message"
      role="img"
      aria-label={t('phone.voiceMessage', { v0: duration })}
    >
      <span className="voice-message-avatar">
        <ControlIcon name="user" />
        <MicrophoneIcon className="voice-message-mic" width="14" height="14" />
      </span>
      <ControlIcon name="play" className="voice-message-play" fill="currentColor" stroke="none" />
      <div className="voice-message-track">
        <VoiceWaveform milliseconds={durationMs} />
        <span className="voice-duration">{duration}</span>
      </div>
    </div>
  );
}
