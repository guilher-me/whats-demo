import { useEffect, useRef } from 'react';
import type { FlowSession, Value, FlowComponent } from '../../../core/types';
import { getComponents, validation } from '../model';
import { resolve, screenError } from '../../../core/engine';
import { FlowField } from './FlowField';
import { FlowFooter } from './FlowFooter';
import { IconButton } from '../../../components/ui/IconButton';
export function FlowSheet({
  session,
  error,
  onChange,
  onBack,
  onClose,
  onNext,
}: {
  session: FlowSession;
  error: string;
  onChange: (name: string, value: Value) => void;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const screen = session.step.flow.screens[session.index];
  let components: FlowComponent[];
  let invalid: string[];
  try {
    components = getComponents(session);
    invalid = validation(session);
  } catch (e) {
    components = [];
    invalid = [(e as Error).message];
  }
  const footer = components.find((c) => c.type === 'Footer');
  const displayError = error || screenError(components) || (!components.length ? invalid[0] : '');
  useEffect(() => {
    content.current?.scrollTo?.(0, 0);
  }, [session.index]);
  if (!session.visible) return null;
  return (
    <div className={`flow-layer ${session.closing ? 'is-closing' : ''}`}>
      <div className="flow-dimmer" />
      <section className="flow-sheet" aria-label="Flow">
        <header className="flow-header">
          {session.history.length > 0 && (
            <IconButton label="Voltar" onClick={onBack}>
              ‹
            </IconButton>
          )}
          <IconButton label="Fechar Flow" onClick={onClose}>
            ×
          </IconButton>
          <strong>{screen.title || screen.id}</strong>
          <span aria-hidden="true">⋮</span>
        </header>
        <div className="flow-content" ref={content}>
          {components
            .filter((c) => c.type !== 'Footer')
            .map((c, i) => (
              <FlowField
                key={`${session.index}:${c.name ?? i}`}
                component={c}
                context={{ data: session.data, form: session.form }}
                onChange={onChange}
              />
            ))}
        </div>
        <FlowFooter
          label={String(
            resolve(footer?.label, { data: session.data, form: session.form }) ?? 'Avançar',
          )}
          disabled={!!invalid.length || session.closing}
          error={displayError}
          onNext={onNext}
        />
      </section>
    </div>
  );
}
