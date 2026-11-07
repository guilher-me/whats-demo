import { currentLocale, useT } from '../../../i18n';
import { useEffect, useId, useMemo, useState } from 'react';
import type { FlowDefinition, FlowStep, Values } from '../../../core/types';
import { validateFlow } from '../../../core/engine';
import { Button } from '../../../components/ui/Button';
import { TextArea, TextField, FieldError } from '../../../components/ui/Field';
import { FormSection } from '../../../components/ui/FormSection';
import {
  flowDefinitionDiagnostics,
  flowDiagnostics,
  type JourneyDiagnostic,
} from '../../flows/diagnostics';
import { VisualFlow } from './VisualFlow';

const tabs = ['visual', 'json'] as const;
type Tab = (typeof tabs)[number];

export function FlowStepEditor({
  step,
  expanded,
  onChange,
  onValidity,
  onPreview,
}: {
  step: FlowStep;
  expanded: boolean;
  onChange: (change: Partial<FlowStep>) => void;
  onValidity: (valid: boolean) => void;
  onPreview: (screenId?: string) => void;
}) {
  const t = useT();
  const id = useId();
  const [tab, setTab] = useState<Tab>('visual');
  const [screenId, setScreenId] = useState(step.flow.screens[0].id);
  const [source, setSource] = useState(() => JSON.stringify(step.flow, null, 2));
  const [draft, setDraft] = useState<{ visual?: FlowDefinition; issues: JourneyDiagnostic[] }>();
  const [answers, setAnswers] = useState(() => JSON.stringify(step.answers, null, 2));
  const [answersError, setAnswersError] = useState('');
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
    onValidity(!draft && !answersError);
  }, [draft, answersError, onValidity]);

  const accept = (input: unknown, visual?: FlowDefinition, selectedId?: string) => {
    let next: FlowDefinition;
    try {
      next = validateFlow(input);
    } catch (error) {
      const issues = flowDefinitionDiagnostics(input);
      setDraft({
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
    const issues = flowDiagnostics({ ...step, flow: next });
    if (issues.some((issue) => issue.kind === 'definition' && issue.severity === 'error')) {
      setDraft({ visual, issues });
      return;
    }
    setDraft(undefined);
    if (JSON.stringify(next) !== JSON.stringify(step.flow)) onChange({ flow: next });
    if (selectedId) onPreview(selectedId);
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    document.getElementById(id + '-' + next)?.focus();
  };
  const selectScreen = (selectedId: string) => {
    setScreenId(selectedId);
    if (step.flow.screens.some((screen) => screen.id === selectedId)) onPreview(selectedId);
  };
  const editAnswers = (raw: string) => {
    setAnswers(raw);
    try {
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error(t('errors.answerObject'));
      onChange({ answers: value as Values });
      setAnswersError('');
    } catch (error) {
      setAnswersError((error as Error).message);
    }
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
          <div role="tablist" aria-label={t('editor.flowStructure')} className="builder-tabs">
            {tabs.map((item) => (
              <Button
                key={item}
                variant="ghost"
                role="tab"
                id={id + '-' + item}
                aria-controls={id + '-panel-' + item}
                aria-selected={tab === item}
                tabIndex={tab === item ? 0 : -1}
                onClick={() => selectTab(item)}
                onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  selectTab(
                    event.key === 'Home'
                      ? 'visual'
                      : event.key === 'End'
                        ? 'json'
                        : item === 'visual'
                          ? 'json'
                          : 'visual',
                  );
                }}
              >
                {t(item === 'visual' ? 'builder.visual' : 'builder.json')}
              </Button>
            ))}
          </div>
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
                setSource(JSON.stringify(value, null, 2));
                accept(value, value, selectedId);
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
          <TextArea
            label="Flow JSON"
            className="json-input"
            spellCheck={false}
            value={source}
            aria-invalid={!!draft || hasDefinitionError || undefined}
            aria-describedby={issues.length ? id + '-issues' : undefined}
            onChange={(event) => {
              const raw = event.currentTarget.value;
              setSource(raw);
              let input: unknown;
              try {
                input = JSON.parse(raw) as unknown;
              } catch (error) {
                setDraft({
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
              accept(input);
            }}
          />
        </div>
        {draft && (
          <div className="builder-draft">
            <FieldError>{t('builder.pending')}</FieldError>
            <Button
              variant="ghost"
              onClick={() => {
                setSource(JSON.stringify(step.flow, null, 2));
                setDraft(undefined);
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
      >
        <TextArea
          label={t('editor.answers')}
          value={answers}
          className="json-input answers-input"
          spellCheck={false}
          aria-invalid={!!answersError}
          aria-describedby={answersError ? id + '-answers-error' : undefined}
          onChange={(event) => editAnswers(event.currentTarget.value)}
        />
        <TextField
          label={t('editor.completion')}
          value={step.completion ?? ''}
          onChange={(event) => onChange({ completion: event.currentTarget.value })}
        />
      </FormSection>
      <FieldError id={id + '-answers-error'}>{answersError}</FieldError>
    </>
  );
}
