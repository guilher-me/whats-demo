import type { RefObject } from 'react';
import type { Project } from '../../../core/types';
import type { Playback } from '../../playback/hooks/usePlayback';
import { PhonePreview } from './PhonePreview';

export function JourneyPhone({
  project,
  playback,
  phoneRef,
  disabled,
  onSend,
  onStart,
}: {
  project: Project;
  playback: Playback;
  phoneRef: RefObject<HTMLDivElement | null>;
  disabled: boolean;
  onSend: () => void;
  onStart: () => void;
}) {
  const first = project.steps[0];
  return (
    <PhonePreview
      contact={project.contact}
      playback={playback}
      phoneRef={phoneRef}
      composerDisabled={disabled}
      onSend={onSend}
      onStartVoice={
        first?.type === 'user' && first.voiceDurationSeconds !== undefined ? onStart : undefined
      }
      onStartAttachment={first?.type === 'user' && first.media ? onStart : undefined}
    />
  );
}
