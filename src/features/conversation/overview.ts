import { resolve, resolveOptions } from '../../core/engine';
import { automaticOption, isReplyButton } from '../../core/message-buttons';
import type {
  ChatMessage,
  FlowComponent,
  FlowSession,
  FlowStep,
  Project,
  Value,
} from '../../core/types';
import { advance, createSession, getComponents } from '../flows/model';
import { t } from '../../i18n';

function answerText(field: FlowComponent, value: Value, session: FlowSession): string {
  if (['RadioButtonsGroup', 'CheckboxGroup', 'Dropdown'].includes(field.type)) {
    const options = resolveOptions(field['data-source'], {
      data: session.data,
      form: session.form,
    });
    const selected = Array.isArray(value) ? value : [value];
    return selected
      .map((id) => options.find((option) => option.id === String(id))?.title)
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

/** Resolve only the configured path and visible fields; never animate or change application state. */
export function flowOverviewReply(step: FlowStep): string {
  const lines: string[] = [];
  try {
    let session = createSession(step);
    const visited = new Set<number>();
    while (visited.size < 30 && !visited.has(session.index)) {
      visited.add(session.index);
      const filled = new Set<string>();
      // Filling one answer may reveal another field on the same screen.
      for (let fieldCount = 0; fieldCount < 200; fieldCount++) {
        const field = getComponents(session).find((c) => c.name && !filled.has(c.name));
        if (!field?.name) break;
        filled.add(field.name);
        const value = resolve(step.answers[field.name], { data: session.data, form: session.form });
        if (value !== undefined)
          session = { ...session, form: { ...session.form, [field.name]: value } };
      }
      for (const field of getComponents(session).filter((c) => c.name)) {
        const value = session.form[field.name!];
        if (value === undefined || value === null || value === '') continue;
        const answer = answerText(field, value, session);
        if (!answer) continue;
        const label = String(
          resolve(field.label, { data: session.data, form: session.form }) ?? field.name,
        ).replace(/[?:]+\s*$/, '');
        lines.push(`${label}: ${answer}`);
      }
      const result = advance(session);
      if (!result.session) break;
      session = result.session;
    }
  } catch {
    // An incomplete editor draft can still show its configured completion and resolved answers.
  }
  return [step.completion, ...lines].filter(Boolean).join('\n');
}

export function conversationOverviewMessages(project: Project): ChatMessage[] {
  return project.steps.flatMap((step, index) => {
    const message: ChatMessage = {
      id: `overview:${index}:message`,
      direction: step.type === 'user' ? 'user' : 'business',
      text: step.text,
      time: '12:00',
      flowStep: step.type === 'flow' ? step : undefined,
      interactive: step.type === 'business' ? step.interactive : undefined,
    };
    let reply = '';
    if (step.type === 'flow') reply = flowOverviewReply(step);
    if (step.type === 'business' && step.interactive) {
      const selected = automaticOption(step.interactive);
      reply =
        selected && (step.interactive.kind === 'list' || isReplyButton(selected))
          ? selected.title
          : '';
      message.selection = selected?.id;
    }
    return reply
      ? [
          message,
          { id: `overview:${index}:reply`, direction: 'user' as const, text: reply, time: '12:00' },
        ]
      : [message];
  });
}
