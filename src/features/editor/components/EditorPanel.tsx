import type { JourneyDiagnostic } from '../../flows/diagnostics';
import { useT } from '../../../i18n';
import { DemoGallery } from '../../demos/DemoGallery';
import type { CartItem, Contact, Project, Step } from '../../../core/types';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useAddedStepFocus } from '../hooks/useAddedStepFocus';
import { scrollToStep } from '../hooks/step-scroll';
import { ContactEditor } from './ContactEditor';
import { StepCard } from './StepCard';
import { AddStepButtons } from './AddStepButtons';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/Field';
import type { StepAction } from './StepActions';
import type { SaveState } from '../hooks/useProject';
import { CatalogEditor } from '../../commerce/CommerceEditor';
import { catalogError, commerceStepError } from '../../../core/commerce';
import type { Product } from '../../../core/types';
import { SortableSteps } from './SortableSteps';
import { TextField } from '../../../components/ui/Field';
import { JOURNEY_TITLE_LIMIT } from '../../journeys/JourneyControls';
import type { AnswersDraft, FlowDraft } from '../../journeys/storage';
interface Props {
  title: string;
  onTitle: (title: string) => void;
  flowDrafts?: Record<string, FlowDraft>;
  answersDrafts?: Record<string, AnswersDraft>;
  onFlowDraft: (id: string, draft?: FlowDraft) => void;
  onAnswersDraft: (id: string, draft?: AnswersDraft) => void;
  saveState: SaveState;
  project: Project;
  diagnostics: JourneyDiagnostic[];
  revision: number;
  activeStep: string | null;
  selectedStep: string | null;
  revealStep?: { id: string };
  onShowCode: (id: string) => void;
  disabled?: boolean;
  onSelect: (id: string | null) => void;
  error: string;
  onCatalog: (catalog: Product[]) => void;
  onContact: (contact: Contact) => void;
  onChange: (id: string, change: Partial<Step>) => void;
  onCartChange: (offerId: string, cartId?: string, items?: CartItem[]) => void;
  onReorder: (steps: Step[]) => void;
  onAction: (id: string, action: StepAction) => void;
  onAdd: (type: Step['type']) => string | undefined;
  onRestore?: () => void;
  onValidity: (id: string, valid: boolean) => void;
  onFlowPreview: (id: string, screenId?: string) => void;
}
export function EditorPanel(props: Props) {
  const t = useT();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(props.project.steps[0]?.id ?? null);
  useEffect(() => {
    setExpandedId(props.project.steps[0]?.id ?? null);
  }, [props.revision]);
  useLayoutEffect(() => {
    if (props.revealStep && scrollRef.current) scrollToStep(scrollRef.current, props.revealStep.id);
  }, [props.revealStep]);
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
            <h2>{t('editor.title')}</h2>
            <p>{t('editor.orderHint')}</p>
          </div>
          {props.onRestore && (
            <Button variant="ghost" onClick={props.onRestore}>
              {t('sharing.restoreSource')}
            </Button>
          )}
        </div>
        {props.project.steps.length === 0 && <DemoGallery />}
        <TextField
          label={t('journeys.title')}
          placeholder={t('journeys.untitled')}
          value={props.title}
          maxLength={JOURNEY_TITLE_LIMIT}
          onChange={(event) => props.onTitle(event.currentTarget.value)}
        />
        <ContactEditor
          key={props.revision}
          contact={props.project.contact}
          onChange={props.onContact}
        />
        <CatalogEditor
          key={`catalog:${props.revision}`}
          project={props.project}
          onChange={props.onCatalog}
          error={catalogError(props.project.catalog, false)}
        />
        <div className="timeline-heading">
          <div className="sequence-title">
            <h3>{t('editor.sequence')}</h3>
          </div>
          <span>{t('editor.stepCount', { count: props.project.steps.length })}</span>
        </div>
        <SortableSteps steps={props.project.steps} onChange={props.onReorder}>
          {(step, index, dragHandle) => (
            <StepCard
              key={`${props.revision}:${step.id}`}
              step={step}
              flowDraft={
                Object.hasOwn(props.flowDrafts ?? {}, step.id)
                  ? props.flowDrafts?.[step.id]
                  : undefined
              }
              answersDraft={
                Object.hasOwn(props.answersDrafts ?? {}, step.id)
                  ? props.answersDrafts?.[step.id]
                  : undefined
              }
              onFlowDraft={(draft) => props.onFlowDraft(step.id, draft)}
              onAnswersDraft={(draft) => props.onAnswersDraft(step.id, draft)}
              project={props.project}
              diagnostics={props.diagnostics}
              commerceError={commerceStepError(props.project, index)}
              index={index}
              total={props.project.steps.length}
              active={props.activeStep === step.id}
              selected={props.selectedStep === step.id}
              dragHandle={dragHandle}
              expanded={(props.selectedStep ?? expandedId) === step.id}
              onToggle={() => {
                const next = (props.selectedStep ?? expandedId) === step.id ? null : step.id;
                setExpandedId(next);
                props.onSelect(next);
              }}
              onSelect={() => {
                setExpandedId(step.id);
                props.onSelect(step.id);
              }}
              onShowCode={() => props.onShowCode(step.id)}
              onChange={(change) => props.onChange(step.id, change)}
              onCartChange={(cartId, items) => props.onCartChange(step.id, cartId, items)}
              onAction={(action) => props.onAction(step.id, action)}
              onValidity={props.onValidity}
              onFlowPreview={(screenId) => props.onFlowPreview(step.id, screenId)}
            />
          )}
        </SortableSteps>
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
