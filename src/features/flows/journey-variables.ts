import { resolveOptions } from '../../core/engine';
import { isVariableField, variablePath, type VariableValues } from '../../core/journey-variables';
import type { FlowComponent, FlowHistory, FlowSession, Value } from '../../core/types';
import { t } from '../../i18n';
import { getComponents } from './model';

export function flowAnswerText(field: FlowComponent, value: Value, session: FlowHistory): string {
  if (['RadioButtonsGroup', 'CheckboxGroup', 'Dropdown'].includes(field.type)) {
    const options = resolveOptions(field['data-source'], {
      data: session.data,
      form: session.form,
    });
    const selected = Array.isArray(value) ? value : [value];
    return selected
      .map((id) => options.find((option) => option.id === id)?.title)
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no');
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function captureFlowVariables(session: FlowSession, values: VariableValues) {
  const { step } = session;
  const snapshots = new Map(
    [...session.history, session].map((snapshot) => [snapshot.index, snapshot]),
  );
  for (const snapshot of snapshots.values()) {
    const screen = step.flow.screens[snapshot.index];
    for (const field of getComponents({ ...session, ...snapshot })) {
      if (!isVariableField(field)) continue;
      const name = field.name!;
      values.set(
        variablePath('flow', step.id, screen.id, name),
        flowAnswerText(field, snapshot.form[name], snapshot),
      );
    }
  }
}
