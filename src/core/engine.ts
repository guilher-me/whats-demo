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
  if (!Array.isArray(value)) throw new Error('data-source precisa ser uma lista de opções.');
  return value.map((option) => {
    if (!isObject(option) || typeof option.id !== 'string' || typeof option.title !== 'string')
      throw new Error('Opção inválida no data-source.');
    return { id: option.id, title: option.title };
  });
}
export function validateFlow(value: unknown): FlowDefinition {
  if (!isObject(value) || !Array.isArray(value.screens) || !value.screens.length)
    throw new Error('O Flow precisa de uma lista screens com pelo menos uma tela.');
  const ids = new Set<string>();
  for (const screen of value.screens) {
    if (!isObject(screen) || typeof screen.id !== 'string' || !screen.id || ids.has(screen.id))
      throw new Error('Cada tela precisa de um id único.');
    ids.add(screen.id);
    if (!isObject(screen.layout) || !Array.isArray(screen.layout.children))
      throw new Error(`A tela ${screen.id} precisa de layout.children.`);
  }
  function walk(children: unknown[], depth = 0) {
    if (depth > 50) throw new Error('O Flow excede o limite de aninhamento.');
    for (const c of children) {
      if (!isObject(c) || typeof c.type !== 'string') throw new Error('Componente sem type.');
      for (const key of ['children', 'then', 'else'])
        if (c[key] !== undefined) {
          if (!Array.isArray(c[key])) throw new Error(`Lista ${key} inválida.`);
          walk(c[key], depth + 1);
        }
      const action = c['on-click-action'];
      if (
        isObject(action) &&
        action.name === 'navigate' &&
        (!isObject(action.next) || !ids.has(String(action.next.name)))
      )
        throw new Error('Tela de destino inexistente.');
    }
  }
  for (const screen of value.screens) walk((screen as FlowScreen).layout.children);
  return value as unknown as FlowDefinition;
}
export function validateField(c: FlowComponent, value: Value): string {
  const label = c.label || c.name || 'campo';
  if (
    c.required &&
    (value == null || value === '' || value === false || (Array.isArray(value) && !value.length))
  )
    return `Preencha ${label}.`;
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    if (c['min-chars'] && value.length < c['min-chars'])
      return `${label} precisa de pelo menos ${c['min-chars']} caracteres.`;
    if (c['max-chars'] && value.length > c['max-chars'])
      return `${label} excedeu o limite de caracteres.`;
    if (c['input-type'] === 'number' && !/^\d+$/.test(value))
      return `Use apenas números em ${label}.`;
    if (c['input-type'] === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return 'Informe um e-mail válido.';
    if (c.pattern) {
      try {
        if (!new RegExp(c.pattern).test(value)) return `Confira o formato de ${label}.`;
      } catch {
        return `Expressão pattern inválida em ${label}.`;
      }
    }
  }
  if (Array.isArray(value) && c['min-selected-items'] && value.length < c['min-selected-items'])
    return `Selecione pelo menos ${c['min-selected-items']} opções.`;
  return '';
}
export function validateProject(input: unknown): Project {
  if (
    !isObject(input) ||
    input.version !== 1 ||
    !isObject(input.contact) ||
    typeof input.contact.name !== 'string' ||
    !Array.isArray(input.steps)
  )
    throw new Error('Arquivo de projeto inválido.');
  if (input.steps.length > 200) throw new Error('O limite é de 200 etapas.');
  if (
    input.contact.avatar &&
    (typeof input.contact.avatar !== 'string' ||
      !/^(data:image\/|assets\/)/.test(input.contact.avatar))
  )
    throw new Error('Use uma foto enviada pelo editor.');
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
      throw new Error('Etapa inválida. Use delays entre 0 e 120 segundos.');
    if (step.type === 'flow') {
      validateFlow(step.flow);
      if (!isObject(step.answers))
        throw new Error('As respostas automáticas precisam ser um objeto JSON.');
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
  if (unknown) return `Componente ainda não suportado: ${unknown.type}.`;
  if (!components.some((c) => c.type === 'Footer')) return 'Adicione um Footer à tela.';
  return '';
}
