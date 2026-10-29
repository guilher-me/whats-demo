import {
  initialData,
  resolve,
  screenError,
  validateField,
  validateFlow,
  visibleComponents,
} from '../../core/engine';
import { clone } from '../../core/project';
import type { FlowSession, FlowStep, Values } from '../../core/types';
export function createSession(step: FlowStep): FlowSession {
  validateFlow(step.flow);
  return {
    step,
    index: 0,
    data: initialData(step.flow.screens[0]),
    form: {},
    history: [],
    visible: true,
    closing: false,
  };
}
export function getComponents(session: FlowSession) {
  return visibleComponents(session.step.flow.screens[session.index], {
    data: session.data,
    form: session.form,
  });
}
export function validation(session: FlowSession): string[] {
  const components = getComponents(session),
    error = screenError(components);
  return error
    ? [error]
    : components
        .filter((c) => c.name)
        .map((c) => validateField(c, session.form[c.name!]))
        .filter(Boolean);
}
export function advance(
  session: FlowSession,
): { session: FlowSession; complete?: never } | { complete: Values; session?: never } {
  const errors = validation(session);
  if (errors.length) throw new Error(errors[0]);
  const action = getComponents(session).find((c) => c.type === 'Footer')?.['on-click-action'];
  if (action?.name === 'complete')
    return {
      complete: resolve(action.payload ?? {}, { data: session.data, form: session.form }) as Values,
    };
  if (action?.name !== 'navigate')
    throw new Error(`Ação não suportada: ${action?.name ?? 'ausente'}. Use navigate ou complete.`);
  const index = session.step.flow.screens.findIndex((screen) => screen.id === action.next?.name);
  if (index < 0) throw new Error('Tela de destino não encontrada.');
  const payload = resolve(action.payload ?? {}, {
    data: session.data,
    form: session.form,
  }) as Values;
  return {
    session: {
      ...session,
      index,
      data: { ...initialData(session.step.flow.screens[index]), ...payload },
      form: {},
      history: [
        ...session.history,
        clone({ index: session.index, data: session.data, form: session.form }),
      ],
    },
  };
}
export function goBack(session: FlowSession): FlowSession {
  const previous = session.history.at(-1);
  return previous ? { ...session, ...previous, history: session.history.slice(0, -1) } : session;
}
