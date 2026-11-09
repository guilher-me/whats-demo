import { resolve } from '../../core/engine';
import { formatPhoneTime } from './phone-time';
import { commercePreview } from '../../core/commerce';
import {
  hasVariableReferences,
  isCustomerText,
  resolveVariableMessage,
  variablePath,
  type VariableValues,
} from '../../core/journey-variables';
import { captureFlowVariables, flowAnswerText } from '../flows/journey-variables';
import { automaticAnswer } from '../flows/answers';
import { automaticOption, isReplyButton } from '../../core/message-buttons';
import type { ChatMessage, FlowComponent, FlowStep, Project } from '../../core/types';
import { advance, createSession, getComponents } from '../flows/model';
import { stepAttachment } from '../../core/attachments';

/** Resolve only the configured path and visible fields; never animate or change application state. */
export function flowOverviewReply(step: FlowStep, variables?: VariableValues): string {
  const lines: string[] = [];
  try {
    let session = createSession(step);
    const visited = new Set<number>();
    while (visited.size < 30 && !visited.has(session.index)) {
      visited.add(session.index);
      const filled = new Set<FlowComponent>();
      // Filling one answer may reveal another field on the same screen.
      for (let fieldCount = 0; fieldCount < 200; fieldCount++) {
        const field = getComponents(session).find((c) => c.name && !filled.has(c));
        if (!field?.name) break;
        filled.add(field);
        const context = { data: session.data, form: session.form };
        const value = variables
          ? automaticAnswer(field, step.answers, context).value
          : resolve(step.answers[field.name], context);
        if (value !== undefined)
          session = { ...session, form: { ...session.form, [field.name]: value } };
      }
      for (const field of getComponents(session).filter((c) => c.name)) {
        const value = session.form[field.name!];
        if (value === undefined || value === null || value === '') continue;
        const answer = flowAnswerText(field, value, session);
        if (!answer) continue;
        const label = String(
          resolve(field.label, { data: session.data, form: session.form }) ?? field.name,
        ).replace(/[?:]+\s*$/, '');
        lines.push(`${label}: ${answer}`);
      }
      const result = advance(session);
      if (!result.session) {
        if (variables) captureFlowVariables(session, variables);
        break;
      }
      session = result.session;
    }
  } catch {
    // An incomplete editor draft can still show its configured completion and resolved answers.
  }
  return [step.completion, ...lines].filter(Boolean).join('\n');
}

export function conversationOverviewMessages(
  project: Project,
  time = formatPhoneTime(),
  through = project.steps.length,
): ChatMessage[] {
  const variables: VariableValues = new Map();
  const capture = project.steps.slice(0, through).some(hasVariableReferences);
  return project.steps.slice(0, through).flatMap((step, index) => {
    const resolved = resolveVariableMessage(step, variables);
    const attachment = stepAttachment(step);
    const message: ChatMessage = {
      id: `overview:${index}:message`,
      direction: step.type === 'user' ? 'user' : 'business',
      text:
        step.type === 'user' && step.commerce
          ? ''
          : step.type !== 'flow' && step.media
            ? (step.media.caption ?? '')
            : step.text,
      ...resolved,
      attachment,
      commerce: commercePreview(project, index),
      time,
      ...(step.type === 'user' && step.voiceDurationSeconds !== undefined
        ? { voiceDurationMs: step.voiceDurationSeconds * 1000 }
        : {}),
      flowStep: step.type === 'flow' ? step : undefined,
      interactive: step.type === 'business' ? step.interactive : undefined,
    };
    let reply = '';
    if (step.type === 'flow') reply = flowOverviewReply(step, capture ? variables : undefined);
    if (capture && isCustomerText(step))
      variables.set(variablePath('chat', step.id, 'text'), step.text.trim());
    if (capture && step.type === 'user' && attachment?.kind === 'location') {
      variables.set(variablePath('location', step.id, 'name'), attachment.name);
      variables.set(variablePath('location', step.id, 'address'), attachment.address ?? '');
    }
    if (step.type === 'business' && step.interactive) {
      const selected = automaticOption(step.interactive);
      reply =
        selected && (step.interactive.kind === 'list' || isReplyButton(selected))
          ? selected.title
          : '';
      message.selection = selected?.id;
      if (capture && selected && (step.interactive.kind === 'list' || isReplyButton(selected))) {
        variables.set(variablePath('choice', step.id, 'title'), selected.title);
        variables.set(variablePath('choice', step.id, 'id'), selected.id);
      }
    }
    return reply
      ? [message, { id: `overview:${index}:reply`, direction: 'user' as const, text: reply, time }]
      : [message];
  });
}

export function previewVariableMessage(project: Project, index: number) {
  if (index < 0 || !hasVariableReferences(project.steps[index])) return;
  const message = conversationOverviewMessages(project, '', index + 1).find(
    ({ id }) => id === 'overview:' + index + ':message',
  );
  if (message) return { text: message.text, formattedText: message.formattedText };
}
