import { currentLocale, useT } from '../../../i18n';
import { useEffect, useId, useMemo, useState } from 'react';
import type { FlowDefinition, FlowStep } from '../../../core/types';
import { validateFlow } from '../../../core/engine';
import { Button } from '../../../components/ui/Button';
import { TextField, FieldError } from '../../../components/ui/Field';
import { FormSection } from '../../../components/ui/FormSection';
import { JsonEditor } from '../../../components/ui/JsonEditor';
import { flowDefinitionDiagnostics, flowDiagnostics } from '../../flows/diagnostics';
import { VisualFlow } from './VisualFlow';
import { AutomaticAnswers } from './AutomaticAnswers';
import { BuilderTabs, type BuilderTab } from './BuilderTabs';
import { answerFields, fillMissingAnswers } from '../../flows/answers';
import type { AnswersDraft, FlowDraft } from '../../journeys/storage';

export function FlowStepEditor({
  step,
  expanded,
  onChange,
  onValidity,
  onPreview,
  draft,
  answersDraft,
  onDraft,
  onAnswersDraft,
}: {
  draft?: FlowDraft;
  answersDraft?: AnswersDraft;
  onDraft: (draft?: FlowDraft) => void;
  onAnswersDraft: (draft?: AnswersDraft) => void;
  step: FlowStep;
  expanded: boolean;
  onChange: (change: Partial<FlowStep>) => void;
  onValidity: (valid: boolean) => void;
  onPreview: (screenId?: string) => void;
}) {
  const t = useT();
  const id = useId();
  const [tab, setTab] = useState<BuilderTab>(draft && !draft.visual ? 'json' : 'visual');
  const [jsonOpened, setJsonOpened] = useState(!!draft && !draft.visual);
  const [screenId, setScreenId] = useState(step.flow.screens[0].id);
  const [source, setSource] = useState(() => draft?.text ?? JSON.stringify(step.flow, null, 2));
  const committedIssues = useMemo(
    () => (expanded ? flowDiagnostics(step) : []),
    [expanded, step, currentLocale()],
  );
  const hasDefinitionError = committedIssues.some(
    (issue) => issue.kind === 'definition' && issue.severity === 'error',
  );
  const candidate = draft?.visual ?? step.flow;
  const issues = draft?.issues ?? committedIssues;
  const readOnly = draft ? !draft.visual : hasDefinitionError;

  useEffect(() => {
    onValidity(!draft);
  }, [draft, onValidity]);

  const accept = (input: unknown, text: string, visual?: FlowDefinition, selectedId?: string) => {
    let next: FlowDefinition;
    try {
      next = validateFlow(input);
    } catch (error) {
      const issues = flowDefinitionDiagnostics(input);
      onDraft({
        text,
        visual,
        issues: issues.some((issue) => issue.severity === 'error')
          ? issues
          : [
              {
                kind: 'definition',
                severity: 'error',
                path: 'flow',
                message: (error as Error).message,
              },
              ...issues,
            ],
      });
      return;
    }
    const issues = flowDefinitionDiagnostics(next);
    if (issues.some((issue) => issue.kind === 'definition' && issue.severity === 'error')) {
      onDraft({ text, visual, issues });
      return;
    }
    if (JSON.stringify(next) !== JSON.stringify(step.flow)) {
      const previous = answerFields(step.flow);
      const fields = answerFields(next);
      const added = new Set([...fields.keys()].filter((name) => !previous.has(name)));
      const answers = fillMissingAnswers(fields, step.answers, added);
      onChange({ flow: next, answers });
    } else onDraft(undefined);
    if (selectedId) onPreview(selectedId);
  };

  const selectTab = (next: BuilderTab) => {
    setTab(next);
    if (next === 'json') setJsonOpened(true);
    document.getElementById(id + '-' + next)?.focus();
  };
  const selectScreen = (selectedId: string) => {
    setScreenId(selectedId);
    if (step.flow.screens.some((screen) => screen.id === selectedId)) onPreview(selectedId);
  };

  return (
    <>
      <TextField
        label={t('editor.buttonText')}
        value={step.label}
        onChange={(event) => onChange({ label: event.currentTarget.value })}
      />
      <FormSection
        title={t('editor.flowStructure')}
        defaultOpen
        summary={t('editor.flowScreens', { count: candidate.screens.length })}
        className="flow-json"
      >
        <div className="builder-toolbar">
          <BuilderTabs id={id} label={t('editor.flowStructure')} tab={tab} onSelect={selectTab} />
          <Button variant="ghost" onClick={() => onPreview()}>
            {t('builder.test')}
          </Button>
        </div>
        <div
          role="tabpanel"
          hidden={tab !== 'visual'}
          id={id + '-panel-visual'}
          aria-labelledby={id + '-visual'}
        >
          {readOnly && <p>{t('builder.readOnly')}</p>}
          {expanded && tab === 'visual' && (
            <VisualFlow
              flow={candidate}
              selectedId={screenId}
              readOnly={readOnly}
              onJson={() => selectTab('json')}
              onSelect={selectScreen}
              onChange={(value, selectedId) => {
                if (selectedId) setScreenId(selectedId);
                const raw = JSON.stringify(value, null, 2);
                setSource(raw);
                accept(value, raw, value, selectedId);
              }}
            />
          )}
        </div>
        <div
          role="tabpanel"
          hidden={tab !== 'json'}
          id={id + '-panel-json'}
          aria-labelledby={id + '-json'}
        >
          {jsonOpened && (
            <JsonEditor
              label="Flow JSON"
              value={source}
              invalid={!!draft || hasDefinitionError}
              describedBy={issues.length ? id + '-issues' : undefined}
              onChange={(raw) => {
                setSource(raw);
                let input: unknown;
                try {
                  input = JSON.parse(raw) as unknown;
                } catch (error) {
                  onDraft({
                    text: raw,
                    issues: [
                      {
                        kind: 'definition',
                        severity: 'error',
                        path: 'flow',
                        message: t('code.invalidJson') + ' ' + (error as Error).message,
                      },
                    ],
                  });
                  return;
                }
                accept(input, raw);
              }}
            />
          )}
        </div>
        {draft && (
          <div className="builder-draft">
            <FieldError>{t('builder.pending')}</FieldError>
            <Button
              variant="ghost"
              onClick={() => {
                setSource(JSON.stringify(step.flow, null, 2));
                onDraft(undefined);
              }}
            >
              {t('builder.discard')}
            </Button>
          </div>
        )}
        {issues.length > 0 && (
          <ul id={id + '-issues'} className="builder-issues" aria-label={t('code.diagnostics')}>
            {issues.map((issue, index) => (
              <li key={index} data-severity={issue.severity}>
                <strong>
                  {t(`code.${issue.kind}`)} ·{' '}
                  {t(issue.severity === 'error' ? 'builder.error' : 'builder.warning')}
                </strong>
                <code>{issue.path}</code>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
      <FormSection
        title={t('editor.autoAnswersTitle')}
        summary={t('editor.autoAnswersHint')}
        className="flow-answers"
        mountOnOpen
      >
        <AutomaticAnswers
          draft={answersDraft}
          onDraft={onAnswersDraft}
          step={step}
          issues={committedIssues.filter((issue) => issue.kind === 'automatic')}
          onChange={(answers) => onChange({ answers })}
        />
        <TextField
          label={t('editor.completion')}
          value={step.completion ?? ''}
          onChange={(event) => onChange({ completion: event.currentTarget.value })}
        />
      </FormSection>
    </>
  );
}
