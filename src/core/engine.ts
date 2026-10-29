import { t } from '../i18n';
import { interactiveError } from './interactive';
import type {
  ExpressionContext,
  FlowComponent,
  FlowDefinition,
  FlowScreen,
  Project,
  Value,
  Values,
  Option,
} from './types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
function reference(path: string, context: ExpressionContext): Value {
  let value: unknown = context;
  for (const key of path.split('.')) {
    if (
      ['__proto__', 'prototype', 'constructor'].includes(key) ||
      !isObject(value) ||
      !Object.hasOwn(value, key)
    )
      return undefined;
    value = value[key];
  }
  return value as Value;
}
export function resolve(value: Value, context: ExpressionContext): Value {
  if (typeof value === 'string') {
    const full = value.match(/^\$\{([\w.]+)\}$/);
    return full
      ? reference(full[1], context)
      : value.replace(/\$\{([\w.]+)\}/g, (_, path: string) =>
          String(reference(path, context) ?? ''),
        );
  }
  if (Array.isArray(value)) return value.map((item) => resolve(item, context));
  if (isObject(value))
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolve(item as Value, context)]),
    );
  return value;
}
function literal(source: string, context: ExpressionContext): Value {
  const text = source.trim();
  if (/^\$\{[\w.]+\}$/.test(text)) return resolve(text, context);
  if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"')))
    return text.slice(1, -1);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (text && Number.isFinite(Number(text))) return Number(text);
  return text;
}
export function condition(
  expression: string | boolean | undefined,
  context: ExpressionContext,
): boolean {
  if (typeof expression === 'boolean') return expression;
  if (typeof expression !== 'string') return false;
  const match = expression.match(/^\s*(.*?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.*?)\s*$/);
  if (!match) return Boolean(resolve(expression, context));
  const a = literal(match[1], context),
    b = literal(match[3], context);
  if (match[2] === '==' || match[2] === '===') return a === b;
  if (match[2] === '!=' || match[2] === '!==') return a !== b;
  if (
    (typeof a !== 'number' && typeof a !== 'string') ||
    (typeof b !== 'number' && typeof b !== 'string')
  )
    return false;
  switch (match[2]) {
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '>=':
      return a >= b;
    case '<=':
      return a <= b;
    default:
      return false;
  }
}
export function flatten(children: FlowComponent[], context: ExpressionContext): FlowComponent[] {
  return children.flatMap((component) =>
    component.type === 'If'
      ? flatten(
          (condition(component.condition, context) ? component.then : component.else) ?? [],
          context,
        )
      : component.type === 'Form'
        ? flatten(component.children ?? [], context)
        : [component],
  );
}
export function initialData(screen: FlowScreen): Values {
  return Object.fromEntries(
    Object.entries(screen.data ?? {}).map(([key, value]) => [
      key,
      value._example_ ?? value.__example__ ?? '',
    ]),
  );
}
export function resolveOptions(
  source: FlowComponent['data-source'],
  context: ExpressionContext,
): Option[] {
  const value = resolve(source as Value, context);
  if (!Array.isArray(value)) throw new Error(t('errors.sourceArray'));
  return value.map((option) => {
    if (!isObject(option) || typeof option.id !== 'string' || typeof option.title !== 'string')
      throw new Error(t('errors.sourceOption'));
    return { id: option.id, title: option.title };
  });
}
export function validateFlow(value: unknown): FlowDefinition {
  if (!isObject(value) || !Array.isArray(value.screens) || !value.screens.length)
    throw new Error(t('errors.screens'));
  const ids = new Set<string>();
  for (const screen of value.screens) {
    if (!isObject(screen) || typeof screen.id !== 'string' || !screen.id || ids.has(screen.id))
      throw new Error(t('errors.screenId'));
    ids.add(screen.id);
    if (!isObject(screen.layout) || !Array.isArray(screen.layout.children))
      throw new Error(t('errors.layout', { v0: screen.id }));
  }
  function walk(children: unknown[], depth = 0) {
    if (depth > 50) throw new Error(t('errors.nesting'));
    for (const c of children) {
      if (!isObject(c) || typeof c.type !== 'string') throw new Error(t('errors.missingType'));
      for (const key of ['children', 'then', 'else'])
        if (c[key] !== undefined) {
          if (!Array.isArray(c[key])) throw new Error(t('errors.invalidList', { v0: key }));
          walk(c[key], depth + 1);
        }
      const action = c['on-click-action'];
      if (
        isObject(action) &&
        action.name === 'navigate' &&
        (!isObject(action.next) || !ids.has(String(action.next.name)))
      )
        throw new Error(t('errors.destination'));
    }
  }
  for (const screen of value.screens) walk((screen as FlowScreen).layout.children);
  return value as unknown as FlowDefinition;
}
export function validateField(c: FlowComponent, value: Value): string {
  const label = c.label || c.name || t('common.field');
  if (
    c.required &&
    (value == null || value === '' || value === false || (Array.isArray(value) && !value.length))
  )
    return t('errors.requiredField', { v0: label });
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    if (c['min-chars'] && value.length < c['min-chars'])
      return t('errors.minChars', { v0: label, v1: c['min-chars'] });
    if (c['max-chars'] && value.length > c['max-chars']) return t('errors.maxChars', { v0: label });
    if (c['input-type'] === 'number' && !/^\d+$/.test(value))
      return t('errors.numbers', { v0: label });
    if (c['input-type'] === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return t('errors.email');
    if (c.pattern) {
      try {
        if (!new RegExp(c.pattern).test(value)) return t('errors.fieldFormat', { v0: label });
      } catch {
        return t('errors.pattern', { v0: label });
      }
    }
  }
  if (Array.isArray(value) && c['min-selected-items'] && value.length < c['min-selected-items'])
    return t('errors.minSelected', { v0: c['min-selected-items'] });
  return '';
}
export function validateProject(input: unknown, { allowDrafts = false } = {}): Project {
  if (
    !isObject(input) ||
    input.version !== 1 ||
    !isObject(input.contact) ||
    typeof input.contact.name !== 'string' ||
    !Array.isArray(input.steps)
  )
    throw new Error(t('errors.project'));
  if (input.steps.length > 200) throw new Error(t('errors.stepLimit'));
  if (
    input.contact.avatar &&
    (typeof input.contact.avatar !== 'string' ||
      !/^(data:image\/|assets\/)/.test(input.contact.avatar))
  )
    throw new Error(t('errors.photo'));
  for (const step of input.steps) {
    if (
      !isObject(step) ||
      !['user', 'business', 'flow'].includes(String(step.type)) ||
      typeof step.text !== 'string' ||
      typeof step.delay !== 'number' ||
      !Number.isFinite(step.delay) ||
      step.delay < 0 ||
      step.delay > 120
    )
      throw new Error(t('errors.invalidStep'));
    if (step.type === 'flow') {
      validateFlow(step.flow);
      if (!isObject(step.answers)) throw new Error(t('errors.answers'));
    }
    if (step.interactive !== undefined) {
      if (step.type !== 'business') throw new Error(t('errors.onlyBusiness'));
      const error = interactiveError(step.interactive, { allowDrafts });
      if (error) throw new Error(error);
      if ((!allowDrafts && !step.text.trim()) || [...step.text].length > 1024)
        throw new Error(t('errors.messageLength'));
    }
  }
  return input as unknown as Project;
}
export const SUPPORTED_COMPONENTS = new Set([
  'TextHeading',
  'TextSubheading',
  'TextBody',
  'TextCaption',
  'RadioButtonsGroup',
  'CheckboxGroup',
  'Dropdown',
  'OptIn',
  'TextInput',
  'TextArea',
  'DatePicker',
  'Footer',
]);
export function visibleComponents(screen: FlowScreen, context: ExpressionContext) {
  return flatten(screen.layout.children, context).filter(
    (c) => resolve(c.visible, context) !== false,
  );
}
export function screenError(components: FlowComponent[]): string {
  const unknown = components.find((c) => !SUPPORTED_COMPONENTS.has(c.type));
  if (unknown) return t('errors.unsupported', { v0: unknown.type });
  if (!components.some((c) => c.type === 'Footer')) return t('errors.missingFooter');
  return '';
}
