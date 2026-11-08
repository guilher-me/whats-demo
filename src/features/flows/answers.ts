import { resolve, resolveOptions, validateField, walkComponents } from '../../core/engine';
import type {
  ExpressionContext,
  FlowComponent,
  FlowDefinition,
  Option,
  Value,
  Values,
} from '../../core/types';
import { t } from '../../i18n';

const kinds = {
  TextInput: 'text',
  TextArea: 'textarea',
  DatePicker: 'date',
  OptIn: 'boolean',
  RadioButtonsGroup: 'choice',
  Dropdown: 'choice',
  CheckboxGroup: 'multiple',
} as const;

export function answerKind(field: FlowComponent) {
  return Object.hasOwn(kinds, field.type) ? kinds[field.type as keyof typeof kinds] : undefined;
}

export function answerFields(flow: FlowDefinition) {
  const fields = new Map<string, FlowComponent[]>();
  for (const screen of flow.screens)
    for (const field of walkComponents(screen.layout.children)) {
      if (!field.name || !answerKind(field)) continue;
      const group = fields.get(field.name);
      if (group) group.push(field);
      else fields.set(field.name, [field]);
    }
  return fields;
}

export function hasAnswerExpression(value: Value): boolean {
  return typeof value === 'string'
    ? value.includes('${') || value.startsWith('`')
    : Array.isArray(value) &&
        value.some((item) => typeof item === 'string' && hasAnswerExpression(item));
}

export function staticAnswerOptions(field: FlowComponent): Option[] | undefined {
  const options = field['data-source'];
  if (
    !Array.isArray(options) ||
    options.some(
      (item) =>
        !item ||
        typeof item.id !== 'string' ||
        !item.id ||
        typeof item.title !== 'string' ||
        hasAnswerExpression(item.id) ||
        hasAnswerExpression(item.title) ||
        ('enabled' in item && typeof item.enabled !== 'boolean'),
    )
  )
    return undefined;
  return options.filter((item) => !('enabled' in item) || item.enabled);
}

const dateRules = ['min-date', 'max-date', 'unavailable-dates'] as const;
const isDate = (value: Value): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000'))
    return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

function dateAllowed(field: FlowComponent, value: string) {
  const min = field['min-date'];
  const max = field['max-date'];
  const unavailable = field['unavailable-dates'];
  return (
    (!isDate(min) || value >= min) &&
    (!isDate(max) || value <= max) &&
    (!Array.isArray(unavailable) || !unavailable.includes(value))
  );
}

type AnswerValue = string | string[] | boolean;
type CheckedAnswer = { value?: AnswerValue; error?: string; options?: Option[] };

export function checkAnswer(field: FlowComponent, input: Value, options?: Option[]): CheckedAnswer {
  const kind = answerKind(field);
  if (!kind) return {};
  if (input === undefined || input === null || input === '') {
    return field.required
      ? { error: t('errors.autoAnswer', { v0: field.label || field.name }) }
      : {};
  }

  const invalid = () => ({ error: t('answers.invalid', { field: field.label || field.name }) });
  let value: AnswerValue;
  switch (kind) {
    case 'boolean':
      if (typeof input !== 'boolean') return invalid();
      value = input;
      break;
    case 'date':
      if (!isDate(input) || !dateAllowed(field, input)) return invalid();
      value = input;
      break;
    case 'multiple': {
      const selected = Array.isArray(input) ? input : [input];
      if (
        !selected.every((id): id is string => typeof id === 'string') ||
        selected.some((id) => !options?.some((option) => option.id === id)) ||
        new Set(selected).size !== selected.length
      )
        return invalid();
      if (
        field['max-selected-items'] !== undefined &&
        selected.length > field['max-selected-items']
      )
        return invalid();
      value = selected;
      break;
    }
    default:
      if (typeof input !== 'string' && (typeof input !== 'number' || !Number.isFinite(input)))
        return invalid();
      value = String(input);
      if (kind === 'choice' && !options?.some((option) => option.id === value)) return invalid();
  }

  // Custom patterns remain part of form submission. Avoid running arbitrary regexes in editor preflight.
  const error = validateField({ ...field, pattern: undefined }, value);
  return error ? { error } : { value, options };
}

export function automaticAnswer(
  field: FlowComponent,
  answers: Values,
  context: ExpressionContext,
): CheckedAnswer {
  const name = field.name;
  if (!name || !answerKind(field)) return {};
  const value = Object.hasOwn(answers, name) ? resolve(answers[name], context) : undefined;
  const kind = answerKind(field);
  let options: Option[] | undefined;
  if (value != null && value !== '' && (kind === 'choice' || kind === 'multiple')) {
    try {
      options = staticAnswerOptions(field) ?? resolveOptions(field['data-source'], context);
    } catch {
      return { error: t('answers.dynamicInvalid', { field: field.label || name }) };
    }
  }
  const dateField =
    kind === 'date'
      ? {
          ...field,
          ...Object.fromEntries(dateRules.map((key) => [key, resolve(field[key], context)])),
        }
      : field;
  return checkAnswer(dateField, value, options);
}

function example(field: FlowComponent): AnswerValue | undefined {
  const kind = answerKind(field);
  if (kind === 'boolean') return field.required === true;
  if (kind === 'date') {
    const min = field['min-date'];
    const max = field['max-date'];
    const unavailable = field['unavailable-dates'];
    if (
      (min !== undefined && !isDate(min)) ||
      (max !== undefined && !isDate(max)) ||
      (unavailable !== undefined && (!Array.isArray(unavailable) || !unavailable.every(isDate)))
    )
      return undefined;
    return ['2030-01-15', min, max].find((date) => isDate(date) && dateAllowed(field, date));
  }

  const type = field['input-type'] ?? 'text';
  const min = field['min-chars'] ?? 0;
  const max = (kind === 'textarea' ? field['max-length'] : undefined) ?? field['max-chars'] ?? 4096;
  if (min > max || min > 4096 || max < 1) return undefined;
  if (type === 'email')
    return ['cliente@example.com', 'a@b.co'].find(
      (email) => email.length >= min && email.length <= max,
    );
  if (type === 'number') return '1'.padEnd(Math.max(1, min), '0');
  if (type !== 'text') return undefined;
  return t('seed.customer').slice(0, max).padEnd(min, 'x');
}

export function answerSuggestion(fields: FlowComponent[]): AnswerValue | undefined {
  if (!fields.length || fields.some((field) => field.pattern)) return undefined;
  const kind = answerKind(fields[0]);
  if (kind === 'choice' || kind === 'multiple') {
    if (fields.some((field) => answerKind(field) !== kind)) return undefined;
    const options = fields.map(staticAnswerOptions);
    const ids = [...new Set(options[0]?.map(({ id }) => id))].filter((id) =>
      options.every((list) => list?.some((option) => option.id === id)),
    );
    const minimum = Math.max(1, ...fields.map((field) => field['min-selected-items'] ?? 0));
    const value =
      kind === 'choice' ? ids[0] : ids.length >= minimum ? ids.slice(0, minimum) : undefined;
    return value !== undefined &&
      fields.every((field, index) => !checkAnswer(field, value, options[index]).error)
      ? value
      : undefined;
  }

  if (fields.some((field) => answerKind(field) !== kind)) return undefined;
  for (const field of fields) {
    const value = example(field);
    if (
      value !== undefined &&
      fields.every((target) => {
        if (kind === 'date' && example(target) === undefined) return false;
        return !checkAnswer(target, value).error;
      })
    )
      return value;
  }
}

export function fillMissingAnswers(
  fields: Map<string, FlowComponent[]>,
  answers: Values,
  only?: ReadonlySet<string>,
): Values {
  const additions = [];
  for (const [name, group] of fields) {
    if (Object.hasOwn(answers, name) || (only && !only.has(name))) continue;
    const value = answerSuggestion(group);
    if (value !== undefined) additions.push([name, value] as const);
  }
  return additions.length ? { ...answers, ...Object.fromEntries(additions) } : answers;
}
