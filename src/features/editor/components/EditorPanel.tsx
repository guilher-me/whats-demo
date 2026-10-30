import { useT } from '../../../i18n';
import type { Contact, Project, Step } from '../../../core/types';
import { useRef } from 'react';
import { useAddedStepFocus } from '../hooks/useAddedStepFocus';
import { ContactEditor } from './ContactEditor';
import { StepCard } from './StepCard';
import { AddStepButtons } from './AddStepButtons';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/Field';
import type { StepAction } from './StepActions';
import { SaveIndicator } from './SaveIndicator';
import type { SaveState } from '../hooks/useProject';
interface Props {
  saveState: SaveState;
  project: Project;
  revision: number;
  activeStep: string | null;
  selectedStep: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  error: string;
  onContact: (contact: Contact) => void;
  onChange: (id: string, change: Partial<Step>) => void;
  onAction: (id: string, action: StepAction) => void;
  onAdd: (type: Step['type']) => string | undefined;
  onRestore: () => void;
  onError: (error: string) => void;
  onValidity: (id: string, valid: boolean) => void;
}
export function EditorPanel(props: Props) {
  const t = useT();

  const scrollRef = useRef<HTMLDivElement>(null);
  const focusAdded = useAddedStepFocus(props.project.steps, scrollRef);
  return (
    <section
      className="editor"
      aria-label={t('editor.region')}
      inert={props.disabled || undefined}
      aria-disabled={props.disabled || undefined}
    >
      <div className="editor-scroll" ref={scrollRef}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('editor.configure')}</span>
            <h2>{t('editor.title')}</h2>
            <p>{t('editor.orderHint')}</p>
          </div>
          <Button variant="ghost" onClick={props.onRestore}>
            {t('editor.restore')}
          </Button>
        </div>
        <ContactEditor
          contact={props.project.contact}
          onChange={props.onContact}
          onError={props.onError}
        />
        <div className="timeline-heading">
          <div className="sequence-title">
            <h3>{t('editor.sequence')}</h3>
            <SaveIndicator state={props.saveState} />
          </div>
          <span>{t('editor.stepCount', { count: props.project.steps.length })}</span>
        </div>
        <div>
          {props.project.steps.map((step, index) => (
            <StepCard
              key={`${props.revision}:${step.id}`}
              step={step}
              index={index}
              total={props.project.steps.length}
              active={props.activeStep === step.id}
              selected={props.selectedStep === step.id}
              onSelect={() => props.onSelect(step.id)}
              onChange={(change) => props.onChange(step.id, change)}
              onAction={(action) => props.onAction(step.id, action)}
              onValidity={props.onValidity}
            />
          ))}
        </div>
        <p className="editor-hint">{t('editor.noNames')}</p>
        {location.protocol === 'file:' && <p className="editor-hint">{t('editor.localLink')}</p>}
        <FieldError>{props.error}</FieldError>
      </div>
      <footer className="editor-footer">
        {props.saveState === 'failed' && (
          <p className="save-warning" role="alert">
            {t('storage.failureHelp')}
          </p>
        )}
        <AddStepButtons
          onAdd={(type) => {
            const id = props.onAdd(type);
            if (id) focusAdded(id);
          }}
          disabled={props.disabled || props.project.steps.length >= 200}
        />
      </footer>
    </section>
  );
}
