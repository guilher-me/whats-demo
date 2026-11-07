import { findCatalogEntry } from 'flowso/catalog';
import { walkComponents } from '../../core/engine';
import type { FlowAction, FlowComponent, FlowDefinition, FlowScreen } from '../../core/types';

export const catalogIds = [
  'text-heading',
  'text-subheading',
  'text-body',
  'text-caption',
  'text-input',
  'text-area',
  'radio-buttons-group',
  'checkbox-group',
  'dropdown',
  'opt-in',
  'date-picker',
] as const;

export function nextId(prefix: string, existing: Iterable<string>) {
  const used = new Set(existing);
  let number = 1;
  while (used.has(prefix + number)) number++;
  return prefix + number;
}

export function createComponent(
  id: (typeof catalogIds)[number],
  flow: FlowDefinition,
  label: string,
  optionLabel: string,
): FlowComponent | undefined {
  const entry = findCatalogEntry(id);
  if (!entry?.component) return undefined;
  const { type } = entry.component;
  if (
    type === 'TextHeading' ||
    type === 'TextSubheading' ||
    type === 'TextBody' ||
    type === 'TextCaption'
  )
    return { type, text: label };

  const names = flow.screens.flatMap((screen) =>
    walkComponents(screen.layout.children).flatMap((component) =>
      component.name ? [component.name] : [],
    ),
  );
  const component = { type, name: nextId('field_', names), label };
  if (type === 'TextInput') return { ...component, 'input-type': 'text' };
  if (type === 'RadioButtonsGroup' || type === 'CheckboxGroup' || type === 'Dropdown')
    return { ...component, 'data-source': [{ id: 'option_1', title: optionLabel }] };
  return component;
}

export function replaceScreen(flow: FlowDefinition, screen: FlowScreen): FlowDefinition {
  return { ...flow, screens: flow.screens.map((item) => (item.id === screen.id ? screen : item)) };
}

export function newScreen(flow: FlowDefinition, title: string, finish: string): FlowScreen {
  return {
    id: nextId(
      'SCREEN_',
      flow.screens.map((screen) => screen.id),
    ),
    title,
    terminal: true,
    layout: {
      type: 'SingleColumnLayout',
      children: [
        { type: 'Footer', label: finish, 'on-click-action': { name: 'complete', payload: {} } },
      ],
    },
  };
}

function referencesScreen(value: unknown, id: string): boolean {
  const pending = [value];
  const reference = '${screen.' + id + '.';
  while (pending.length) {
    const entry = pending.pop();
    if (typeof entry === 'string' && entry.includes(reference)) return true;
    if (!entry || typeof entry !== 'object') continue;
    if ('type' in entry && entry.type === 'screen' && 'name' in entry && entry.name === id)
      return true;
    for (const child of Object.values(entry)) pending.push(child);
  }
  return false;
}

export function canRemoveScreen(flow: FlowDefinition, id: string) {
  return (
    flow.screens[0]?.id !== id &&
    !flow.screens.some((screen) => screen.id !== id && referencesScreen(screen, id)) &&
    !Object.entries(flow.routing_model ?? {}).some(
      ([from, targets]) => from !== id && Array.isArray(targets) && targets.includes(id),
    )
  );
}

export function removeScreen(flow: FlowDefinition, id: string): FlowDefinition {
  const next = { ...flow, screens: flow.screens.filter((screen) => screen.id !== id) };
  if (next.routing_model) {
    next.routing_model = { ...next.routing_model };
    delete next.routing_model[id];
  }
  return next;
}

export function addComponent(screen: FlowScreen, component: FlowComponent): FlowScreen {
  const children = screen.layout.children;
  const form = children.find((item) => item.type === 'Form');
  const insert = (items: FlowComponent[]) => {
    const footer = items.findIndex((item) => item.type === 'Footer');
    const index = footer < 0 ? items.length : footer;
    return [...items.slice(0, index), component, ...items.slice(index)];
  };
  return {
    ...screen,
    layout: {
      ...screen.layout,
      children: form
        ? children.map((item) =>
            item === form ? { ...item, children: insert(item.children ?? []) } : item,
          )
        : insert(children),
    },
  };
}

/** Change one Footer route while keeping the payload and other routes. */
export function changeFooter(
  flow: FlowDefinition,
  screen: FlowScreen,
  oldAction: FlowAction,
  destination: string,
): FlowDefinition {
  const next = replaceScreen(flow, { ...screen, terminal: !destination });
  if (!flow.routing_model) return next;
  const oldDestination = oldAction.name === 'navigate' ? oldAction.next?.name : undefined;
  const stillUsed = walkComponents(screen.layout.children).some(
    (component) =>
      component['on-click-action']?.name === 'navigate' &&
      component['on-click-action'].next?.name === oldDestination,
  );
  const targets = (flow.routing_model[screen.id] ?? []).filter(
    (id) => id !== oldDestination || stillUsed,
  );
  if (destination && !targets.includes(destination)) targets.push(destination);
  const routing = { ...flow.routing_model };
  if (targets.length) return { ...next, routing_model: { ...routing, [screen.id]: targets } };
  delete routing[screen.id];
  return { ...next, routing_model: routing };
}

export function footerAction(action: FlowAction, destination: string): FlowAction {
  const { next: _previous, ...fields } = action;
  return destination
    ? { ...fields, name: 'navigate', next: { type: 'screen', name: destination } }
    : { ...fields, name: 'complete' };
}
