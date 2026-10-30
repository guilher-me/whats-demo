import type { RefObject } from 'react';
import type { ChatMessage, Project } from '../../../core/types';
import { useT } from '../../../i18n';
import { PhoneFrame } from './PhoneFrame';
import { MessageBubble } from './MessageBubble';

const noAction = () => {};

/** Read-only overview of authored steps. It never runs or changes the playback history. */
export function ConversationOverview({
  project,
  phoneRef,
}: {
  project: Project;
  phoneRef: RefObject<HTMLDivElement | null>;
}) {
  const t = useT();
  return (
    <PhoneFrame contact={project.contact} phoneRef={phoneRef}>
      <div className="chat-body overview-chat" aria-label={t('app.viewConversation')}>
        <div className="day">{t('phone.today')}</div>
        <div className="messages">
          {project.steps.map((step) => {
            const message: ChatMessage = {
              id: step.id,
              direction: step.type === 'user' ? 'user' : 'business',
              text: step.text,
              time: '12:00',
              flowStep: step.type === 'flow' ? step : undefined,
              interactive: step.type === 'business' ? step.interactive : undefined,
            };
            return (
              <MessageBubble
                key={step.id}
                message={message}
                running={false}
                pendingId={null}
                onOpen={noAction}
                onReply={noAction}
                onList={noAction}
              />
            );
          })}
        </div>
      </div>
    </PhoneFrame>
  );
}
