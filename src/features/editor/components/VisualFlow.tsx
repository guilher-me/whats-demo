import { useRef, type ReactNode } from 'react';
import { findCatalogEntry } from 'flowso/catalog';
import { compareVersions } from 'flowso/schema';
import { Button } from '../../../components/ui/Button';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { TextArea, TextField } from '../../../components/ui/Field';
import type { FlowComponent, FlowDefinition, FlowScreen } from '../../../core/types';
import { useT, type MessageKey } from '../../../i18n';
import {
  addComponent,
  canRemoveScreen,
  catalogIds,
  changeFooter,
  createComponent,
  footerAction,
  newScreen,
  nextId,
  removeScreen,
  replaceScreen,
} from '../../flows/visual-flow';
import { SortableOptions } from './SortableOptions';

const labels: Record<string, MessageKey> = {
  TextHeading: 'builder.heading',
  TextSubheading: 'builder.subheading',
  TextBody: 'builder.body',
  TextCaption: 'builder.caption',
  TextInput: 'builder.input',
  TextArea: 'builder.textArea',
  RadioButtonsGroup: 'builder.radio',
  CheckboxGroup: 'builder.checkboxes',
  Dropdown: 'builder.dropdown',
  OptIn: 'builder.optIn',
  DatePicker: 'builder.date',
  Footer: 'builder.footer',
  Form: 'builder.form',
};

const choiceTypes = ['RadioButtonsGroup', 'CheckboxGroup', 'Dropdown'];
const textTypes = ['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption'];

function canEdit(component: FlowComponent) {
  if (!Object.hasOwn(labels, component.type) || component.type === 'Form') return false;
  if (component.visible !== undefined && typeof component.visible !== 'boolean') return false;
  if (component.required !== undefined && typeof component.required !== 'boolean') return false;
  if (
    [component.label, component.text, component['helper-text']].some(
      (text) => text !== undefined && (typeof text !== 'string' || text.includes('${')),
    )
  )
    return false;
  if (
    choiceTypes.includes(component.type) &&
    (!Array.isArray(component['data-source']) ||
      component['data-source'].some(
        (option) =>
          !option ||
          typeof option.id !== 'string' ||
          typeof option.title !== 'string' ||
          option.title.includes('${'),
      ))
  )
    return false;
  if (component.type === 'Footer')
    return ['complete', 'navigate'].includes(component['on-click-action']?.name ?? '');
  return !['on-click-action', 'on-select-action', 'on-unselect-action'].some((event) =>
    Object.hasOwn(component, event),
  );
}

function ComponentFields({
  component,
  onChange,
}: {
  component: FlowComponent;
  onChange: (value: FlowComponent) => void;
}) {
  const t = useT();
  const options =
    choiceTypes.includes(component.type) && Array.isArray(component['data-source'])
      ? component['data-source']
      : undefined;
  if (textTypes.includes(component.type))
    return (
      <TextArea
        label={t('builder.text')}
        rows={2}
        value={component.text ?? ''}
        onChange={(event) => onChange({ ...component, text: event.currentTarget.value })}
      />
    );
  return (
    <>
      <TextField
        label={t('builder.label')}
        value={component.label ?? ''}
        onChange={(event) => onChange({ ...component, label: event.currentTarget.value })}
      />
      {component.name && (
        <label className="builder-required">
          <input
            type="checkbox"
            checked={component.required ?? false}
            onChange={(event) => onChange({ ...component, required: event.currentTarget.checked })}
          />
          {t('builder.required')}
        </label>
      )}
      {['TextInput', 'TextArea'].includes(component.type) && (
        <TextField
          label={t('builder.helper')}
          value={component['helper-text'] ?? ''}
          onChange={(event) =>
            onChange({ ...component, 'helper-text': event.currentTarget.value || undefined })
          }
        />
      )}
      {component.type === 'TextInput' && (
        <label className="field">
          {t('builder.inputType')}
          <select
            value={component['input-type'] ?? 'text'}
            onChange={(event) =>
              onChange({ ...component, 'input-type': event.currentTarget.value })
            }
          >
            {Array.from(
              new Set(['text', 'email', 'number', component['input-type'] ?? 'text']),
            ).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      )}
      {(component.type === 'TextInput'
        ? (['min-chars', 'max-chars'] as const)
        : component.type === 'TextArea'
          ? (['max-length'] as const)
          : component.type === 'CheckboxGroup'
            ? (['min-selected-items'] as const)
            : []
      ).map((field) => (
        <TextField
          key={field}
          type="number"
          min={0}
          label={t(
            field === 'min-chars'
              ? 'builder.minChars'
              : field === 'min-selected-items'
                ? 'builder.minChoices'
                : 'builder.maxChars',
          )}
          value={component[field] ?? ''}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            onChange({ ...component, [field]: Number.isFinite(value) ? value : undefined });
          }}
        />
      ))}
      {options && (
        <div className="builder-options">
          {options.map((option, index) => (
            <div key={option.id} className="builder-option">
              <TextField
                label={t('builder.option', { number: index + 1 })}
                value={option.title}
                onChange={(event) => {
                  const title = event.currentTarget.value;
                  onChange({
                    ...component,
                    'data-source': options.map((item) =>
                      item === option ? { ...item, title } : item,
                    ),
                  });
                }}
              />
              <Button
                variant="ghost"
                aria-label={t('builder.removeOption', { number: index + 1 })}
                disabled={options.length <= 1}
                onClick={() =>
                  onChange({
                    ...component,
                    'data-source': options.filter((item) => item !== option),
                  })
                }
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() =>
              onChange({
                ...component,
                'data-source': [
                  ...options,
                  {
                    id: nextId(
                      'option_',
                      options.map((item) => item.id),
                    ),
                    title: t('builder.option', { number: options.length + 1 }),
                  },
                ],
              })
            }
          >
            {t('builder.addOption')}
          </Button>
        </div>
      )}
    </>
  );
}

export function VisualFlow({
  flow,
  selectedId,
  readOnly,
  onChange,
  onSelect,
  onJson,
}: {
  flow: FlowDefinition;
  selectedId: string;
  readOnly: boolean;
  onChange: (flow: FlowDefinition, selectedId?: string) => void;
  onSelect: (id: string) => void;
  onJson: () => void;
}) {
  const t = useT();
  const ids = useRef(new WeakMap<FlowComponent, string>());
  const sequence = useRef(0);
  const screen = flow.screens.find((item) => item.id === selectedId) ?? flow.screens[0];
  const removable = canRemoveScreen(flow, screen.id);
  const displayName = (component: { type: string }) =>
    Object.hasOwn(labels, component.type) ? t(labels[component.type]) : component.type;
  const keyOf = (component: FlowComponent) => {
    const current = ids.current.get(component);
    if (current) return current;
    const id = 'component-' + sequence.current++;
    ids.current.set(component, id);
    return id;
  };
  const screenWithChildren = (children: FlowComponent[]): FlowScreen => ({
    ...screen,
    layout: { ...screen.layout, children },
  });

  const list = (
    components: FlowComponent[],
    toScreen: (items: FlowComponent[]) => FlowScreen,
    depth = 0,
  ) => {
    const entries = components.filter((item) => item.type !== 'Footer');
    const advanced = (item: FlowComponent) => (
      <div key={keyOf(item)} className="builder-advanced">
        <strong>{displayName(item)}</strong>
        <small>{t('builder.advanced')}</small>
        <Button variant="ghost" onClick={onJson}>
          {t('builder.json')}
        </Button>
      </div>
    );
    const card = (component: FlowComponent, handle?: ReactNode) => {
      const update = (value: FlowComponent) => {
        ids.current.set(value, keyOf(component));
        return toScreen(components.map((item) => (item === component ? value : item)));
      };
      return (
        <details key={keyOf(component)} className="builder-component">
          <summary>
            {handle}
            <span>{displayName(component)}</span>
            {component.name && <code>{component.name}</code>}
          </summary>
          <fieldset disabled={readOnly} className="builder-fields">
            {component.type === 'Footer' ? (
              <>
                <ComponentFields
                  component={component}
                  onChange={(value) => onChange(replaceScreen(flow, update(value)))}
                />
                <label className="field">
                  {t('builder.footerAction')}
                  <select
                    value={component['on-click-action']?.next?.name ?? ''}
                    onChange={(event) => {
                      const destination = event.currentTarget.value;
                      const previous = component['on-click-action']!;
                      const value = {
                        ...component,
                        'on-click-action': footerAction(previous, destination),
                      };
                      onChange(changeFooter(flow, update(value), previous, destination));
                    }}
                  >
                    <option value="">{t('builder.finish')}</option>
                    {flow.screens
                      .filter((item) => item.id !== screen.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {t('builder.nextScreen', { title: item.title })}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <ComponentFields
                  component={component}
                  onChange={(value) => onChange(replaceScreen(flow, update(value)))}
                />
                <Button
                  variant="danger"
                  onClick={() =>
                    onChange(
                      replaceScreen(
                        flow,
                        toScreen(components.filter((item) => item !== component)),
                      ),
                    )
                  }
                >
                  {t('builder.removeComponent')}
                </Button>
              </>
            )}
          </fieldset>
        </details>
      );
    };
    const groups: FlowComponent[][] = [];
    for (const item of entries) {
      const previous = groups.at(-1);
      if (canEdit(item) && previous && canEdit(previous[0])) previous.push(item);
      else groups.push([item]);
    }
    return (
      <div className="builder-components">
        {groups.map((group, index) => {
          const first = group[0];
          if (canEdit(first)) {
            if (readOnly || group.length === 1) return group.map((item) => card(item));
            const rows = group.map((component) => ({
              id: keyOf(component),
              title: displayName(component),
              component,
            }));
            const offset = components.indexOf(first);
            return (
              <SortableOptions
                key={index}
                options={rows}
                onChange={(items) =>
                  onChange(
                    replaceScreen(
                      flow,
                      toScreen([
                        ...components.slice(0, offset),
                        ...items.map(({ component }) => component),
                        ...components.slice(offset + group.length),
                      ]),
                    ),
                  )
                }
              >
                {({ component }, _index, handle) => card(component, handle)}
              </SortableOptions>
            );
          }
          if (first.type === 'Form' && depth === 0)
            return (
              <div key={keyOf(first)} className="builder-form">
                <strong>{displayName(first)}</strong>
                {list(
                  first.children ?? [],
                  (children) => {
                    const form = { ...first, children };
                    ids.current.set(form, keyOf(first));
                    return toScreen(components.map((node) => (node === first ? form : node)));
                  },
                  depth + 1,
                )}
              </div>
            );
          return advanced(first);
        })}
        {components
          .filter((item) => item.type === 'Footer')
          .map((item) => (canEdit(item) ? card(item) : advanced(item)))}
      </div>
    );
  };
  return (
    <div className="visual-flow">
      <div className="builder-screens" role="group" aria-label={t('builder.screens')}>
        {flow.screens.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            title={item.id}
            aria-pressed={item.id === screen.id}
            onClick={() => onSelect(item.id)}
          >
            {item.title || item.id}
          </Button>
        ))}
        <Button
          disabled={readOnly}
          onClick={() => {
            const added = newScreen(
              flow,
              t('builder.newScreen', { number: flow.screens.length + 1 }),
              t('builder.finish'),
            );
            onChange({ ...flow, screens: [...flow.screens, added] }, added.id);
          }}
        >
          {t('builder.addScreen')}
        </Button>
      </div>
      <div className="builder-screen-fields">
        <TextField
          label={t('builder.screenTitle')}
          disabled={readOnly}
          value={screen.title ?? ''}
          onChange={(event) =>
            onChange(replaceScreen(flow, { ...screen, title: event.currentTarget.value }))
          }
        />
        <small className="builder-screen-id">{screen.id}</small>
        {list(screen.layout.children, screenWithChildren)}
        <div className="builder-add">
          <ActionMenu
            label={t('builder.addComponent')}
            icon="flow"
            showLabel
            disabled={readOnly}
            items={catalogIds.flatMap((id) => {
              const entry = findCatalogEntry(id);
              if (!entry?.component) return [];
              const label = displayName(entry.component);
              const disabled =
                compareVersions(
                  typeof flow.version === 'string' ? flow.version : '0',
                  entry.minVersion,
                ) < 0;
              return [
                {
                  label: disabled ? `${label} · ${entry.minVersion}` : label,
                  disabled,
                  onSelect: () => {
                    const value = createComponent(
                      id,
                      flow,
                      label,
                      t('builder.option', { number: 1 }),
                    );
                    if (value) onChange(replaceScreen(flow, addComponent(screen, value)));
                  },
                },
              ];
            })}
          />
        </div>
        <Button
          variant="danger"
          disabled={readOnly || !removable}
          onClick={() => onChange(removeScreen(flow, screen.id), flow.screens[0].id)}
        >
          {t('builder.removeScreen')}
        </Button>
        {!removable && <small>{t('builder.removeScreenHint')}</small>}
      </div>
    </div>
  );
}
