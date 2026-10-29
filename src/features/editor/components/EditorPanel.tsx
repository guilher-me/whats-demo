import type { Contact, Project, Step } from '../../../core/types';
import { ContactEditor } from './ContactEditor';
import { StepCard } from './StepCard';
import { AddStepButtons } from './AddStepButtons';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/Field';
import type { StepAction } from './StepActions';
interface Props {
  project: Project;
  revision: number;
  activeStep: string | null;
  error: string;
  onContact: (contact: Contact) => void;
  onChange: (id: string, change: Partial<Step>) => void;
  onAction: (id: string, action: StepAction) => void;
  onAdd: (type: Step['type']) => void;
  onRestore: () => void;
  onError: (error: string) => void;
  onValidity: (id: string, valid: boolean) => void;
}
export function EditorPanel(props: Props) {
  return (
    <section className="editor" aria-label="Editor de conversa">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / CONFIGURE</span>
          <h2>Monte a conversa</h2>
          <p>As etapas são executadas na ordem abaixo.</p>
        </div>
        <Button variant="ghost" onClick={props.onRestore}>
          Restaurar exemplo
        </Button>
      </div>
      <ContactEditor
        contact={props.project.contact}
        onChange={props.onContact}
        onError={props.onError}
      />
      <div className="timeline-heading">
        <h3>Sequência</h3>
        <span>{props.project.steps.length} etapas</span>
      </div>
      <div>
        {props.project.steps.map((step, index) => (
          <StepCard
            key={`${props.revision}:${step.id}`}
            step={step}
            index={index}
            total={props.project.steps.length}
            active={props.activeStep === step.id}
            onChange={(change) => props.onChange(step.id, change)}
            onAction={(action) => props.onAction(step.id, action)}
            onValidity={props.onValidity}
          />
        ))}
      </div>
      <AddStepButtons onAdd={props.onAdd} disabled={props.project.steps.length >= 200} />
      <p className="editor-hint">Os balões da conversa não mostram nomes de remetente.</p>
      {location.protocol === 'file:' && (
        <p className="editor-hint">
          Links de arquivos locais funcionam apenas onde o arquivo existe. Para compartilhar entre
          computadores, disponibilize o app em um endereço web.
        </p>
      )}
      <FieldError>{props.error}</FieldError>
    </section>
  );
}
