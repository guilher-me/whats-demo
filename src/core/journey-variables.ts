import { isReplyButton } from './message-buttons';
import { parseMessageFormatting, type MessageSegment } from './message-formatting';
import type { FlowComponent, Project, Step } from './types';
import { t } from '../i18n';

const simpleSegment = /^[A-Za-z0-9_-]+$/;
const quoted = '"(?:[^"\\\\\\x00-\\x1f]|\\\\(?:["\\\\/bfnrt]|u[0-9a-fA-F]{4}))*"';
const pathSegment = new RegExp('\\.([A-Za-z0-9_-]+)|\\[(' + quoted + ')\\]', 'y');
const variableStart = /\{\{\s*(chat|choice|flow|location)(?=[.[])/g;
const variableEnd = new RegExp('\\s*(?:\\?\\?\\s*(' + quoted + ')\\s*)?\\}\\}', 'y');

export function variablePath(root: string, ...parts: string[]): string {
  return (
    root +
    parts
      .map((part) => (simpleSegment.test(part) ? '.' + part : '[' + JSON.stringify(part) + ']'))
      .join('')
  );
}

type Reference = { from: number; to: number; path?: string; sourceId?: string; fallback?: string };

function references(text: string): Reference[] {
  const starts = new RegExp(variableStart);
  const results: Reference[] = [];
  for (const match of text.matchAll(starts)) {
    if (match.index < (results.at(-1)?.to ?? 0)) continue;
    const parts: string[] = [];
    let end = match.index + match[0].length;
    for (;;) {
      pathSegment.lastIndex = end;
      const segment = pathSegment.exec(text);
      if (!segment) break;
      parts.push(segment[1] ?? JSON.parse(segment[2]));
      end = pathSegment.lastIndex;
    }
    variableEnd.lastIndex = end;
    const closing = variableEnd.exec(text);
    results.push(
      closing
        ? {
            from: match.index,
            to: variableEnd.lastIndex,
            path: variablePath(match[1], ...parts),
            sourceId: parts[0],
            fallback: closing[1] === undefined ? undefined : JSON.parse(closing[1]),
          }
        : { from: match.index, to: end },
    );
  }
  return results;
}

export type VariableValues = Map<string, string>;
export interface VariableOption {
  path: string;
  group: string;
  label: string;
  optional?: boolean;
  example?: string;
}

const fields = new Set([
  'TextInput',
  'TextArea',
  'DatePicker',
  'RadioButtonsGroup',
  'CheckboxGroup',
  'Dropdown',
  'OptIn',
]);
export const isVariableField = (field: FlowComponent) => !!field.name && fields.has(field.type);

export function isCustomerText(step: Step | undefined): boolean {
  return (
    step?.type === 'user' &&
    step.voiceDurationSeconds === undefined &&
    !step.media &&
    !step.commerce
  );
}

export function variableOptions(step: Step): VariableOption[] {
  const group = step.id;
  const option = (root: string, key: string, label: string, optional?: boolean) => ({
    path: variablePath(root, step.id, key),
    group,
    label,
    optional,
  });
  if (step.type === 'flow') {
    return step.flow.screens.flatMap((screen, screenIndex) => {
      const items = new Map<string, VariableOption>();
      const visit = (components: FlowComponent[], conditional = false) => {
        for (const field of components) {
          if (isVariableField(field)) {
            const name = field.name!;
            const path = variablePath('flow', step.id, screen.id, name);
            const label =
              typeof field.label === 'string' && !field.label.startsWith('$' + '{')
                ? field.label
                : name;
            items.set(path, {
              path,
              group:
                group +
                ' › ' +
                (step.label || t('editor.flowInvitation')) +
                ' › ' +
                (screen.title || screen.id),
              label,
              optional:
                screenIndex > 0 ||
                conditional ||
                !field.required ||
                (field.visible !== undefined && field.visible !== true) ||
                items.has(path),
            });
          }
          visit(field.children ?? [], conditional);
          visit(field.then ?? [], true);
          visit(field.else ?? [], true);
        }
      };
      visit(screen.layout.children);
      return [...items.values()];
    });
  }
  if (step.type === 'user' && step.media?.kind === 'location')
    return [
      option('location', 'name', t('variables.locationName')),
      option('location', 'address', t('variables.locationAddress'), true),
    ];
  if (isCustomerText(step)) return [option('chat', 'text', t('variables.chatText'))];
  if (
    step.type === 'business' &&
    (step.interactive?.kind === 'list' || step.interactive?.buttons.some(isReplyButton))
  )
    return [
      option('choice', 'title', t('variables.choiceTitle')),
      option('choice', 'id', t('variables.choiceId')),
    ];
  return [];
}

export const previousVariables = (project: Project, index: number) =>
  project.steps.slice(0, index).flatMap(variableOptions);

export function variableText(
  step: Step,
): { text: string; field: string; max?: number } | undefined {
  if (step.type === 'flow') return { text: step.text, field: 'text' };
  if (step.type !== 'business') return;
  if (step.media) {
    if (step.media.kind === 'image')
      return { text: step.media.caption ?? '', field: 'media.caption', max: 1024 };
    return;
  }
  return { text: step.text, field: 'text', max: step.interactive ? 1024 : undefined };
}

export const hasVariableReferences = (step: Step) =>
  references(variableText(step)?.text ?? '').length > 0;

export function referencedVariableStepIds(step: Step): string[] {
  return references(variableText(step)?.text ?? '').flatMap(({ sourceId }) =>
    sourceId ? [sourceId] : [],
  );
}

export function variableIssues(project: Project) {
  if (!project.steps.some(hasVariableReferences)) return [];
  const ids = project.steps.map((step) => step.id);
  if (ids.some((id) => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) {
    return [
      {
        kind: 'definition' as const,
        severity: 'error' as const,
        path: 'steps',
        message: t('sharing.stepIds'),
      },
    ];
  }
  const sources = new Map<string, { index: number; optional?: boolean }>();
  project.steps.forEach((step, index) => {
    for (const option of variableOptions(step))
      sources.set(option.path, { index, optional: option.optional });
  });
  return project.steps.flatMap((step, index) => {
    const target = variableText(step);
    if (!target) return [];
    return references(target.text).flatMap((ref) => {
      const source = ref.path ? sources.get(ref.path) : undefined;
      const key = !ref.path
        ? 'variables.syntax'
        : !source
          ? 'variables.unknown'
          : source.index >= index
            ? 'variables.later'
            : source.optional && ref.fallback === undefined
              ? 'variables.missing'
              : undefined;
      return key
        ? [
            {
              kind: 'definition' as const,
              severity: key === 'variables.missing' ? ('warning' as const) : ('error' as const),
              path: 'steps[' + index + '].' + target.field,
              message: t(key, { path: ref.path }),
            },
          ]
        : [];
    });
  });
}

export function resolveVariableMessage(
  step: Step,
  values: VariableValues,
): { text: string; formattedText?: MessageSegment[] } | undefined {
  const target = variableText(step);
  if (!target) return;
  const refs = references(target.text).filter((ref) => ref.path !== undefined);
  if (!refs.length) return { text: target.text };

  // Keep variable content out of the formatting parser, including characters in quoted paths.
  let delimiter = '\u0000';
  while (target.text.includes(delimiter)) delimiter += '\u0000';
  let masked = '';
  let last = 0;
  const replacements = refs.map(({ from, to, path, fallback }, index) => {
    masked += target.text.slice(last, from) + delimiter + index + delimiter;
    last = to;
    const value = values.get(path!);
    return value?.trim() ? value : (fallback ?? '');
  });
  masked += target.text.slice(last);
  const marker = new RegExp(delimiter + '(\\d+)' + delimiter, 'g');
  let remaining = target.max ?? Infinity;
  let text = '';
  const interpolate = (segments: MessageSegment[]): MessageSegment[] =>
    segments.map((segment) => {
      if (segment.type !== 'text') return { ...segment, children: interpolate(segment.children) };
      let value = segment.text.replace(marker, (_, index) => replacements[Number(index)]);
      if (Number.isFinite(remaining)) {
        // Captions use the persisted UTF-16 limit; interactive messages count Unicode characters.
        const units = [...value];
        let length = 0;
        let used = 0;
        while (used < units.length) {
          const size = target.field === 'media.caption' ? units[used].length : 1;
          if (length + size > remaining) break;
          length += size;
          used++;
        }
        value = units.slice(0, used).join('');
        remaining = used < units.length ? 0 : remaining - length;
      }
      text += value;
      return { type: 'text', text: value };
    });
  const formattedText = interpolate(parseMessageFormatting(masked));
  return { text, formattedText };
}
