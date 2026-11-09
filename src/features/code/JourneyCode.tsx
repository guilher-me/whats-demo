import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FieldError } from '../../components/ui/Field';
import { JsonEditor } from '../../components/ui/JsonEditor';
import type { Project } from '../../core/types';
import { useT } from '../../i18n';
import type { CodeDraft } from '../journeys/storage';
import { reviewJourney, type JourneyDiagnostic } from '../flows/diagnostics';
import { stepRanges } from './step-ranges';

export function JourneyCode({
  project,
  diagnostics,
  disabled,
  onApply,
  draft,
  onDraftChange,
  selectedStep,
  revealStep,
  onSelectStep,
  onShowStep,
}: {
  draft?: CodeDraft;
  onDraftChange: (draft?: CodeDraft) => void;
  project: Project;
  diagnostics: JourneyDiagnostic[];
  disabled: boolean;
  onApply: (project: Project) => void;
  selectedStep?: string;
  revealStep?: { id: string };
  onSelectStep?: (id: string) => void;
  onShowStep?: (id: string) => void;
}) {
  const t = useT();
  const current = useMemo(() => JSON.stringify(project, null, 2), [project]);
  const [result, setResult] = useState<{
    diagnostics?: JourneyDiagnostic[];
    error?: string;
    status?: string;
  }>();
  const text = draft?.text ?? current;
  const ranges = useMemo(() => stepRanges(text.replace(/\r\n?/g, '\n')), [text]);
  const [cursor, setCursor] = useState<{ text: string; offset: number }>();
  const knownStep = (id: string) => project.steps.some((step) => step.id === id);
  const stepAt = (offset: number) => {
    for (const [id, { from, to }] of ranges) {
      if (from <= offset && offset <= to && knownStep(id)) return id;
    }
  };
  const cursorStep = cursor?.text === text ? stepAt(cursor.offset) : undefined;
  const highlight = selectedStep ? ranges.get(selectedStep) : undefined;
  const reveal = revealStep && ranges.get(revealStep.id);
  const navigate = (offset: number) => {
    setCursor({ text, offset });
    const id = stepAt(offset);
    if (id) onSelectStep?.(id);
  };
  const stale = !!draft && draft.base !== current;
  const issues = draft ? (result?.diagnostics ?? []) : diagnostics;

  const check = (apply: boolean) => {
    setResult(undefined);
    let candidate: unknown;
    try {
      candidate = JSON.parse(text) as unknown;
    } catch (failure) {
      setResult({ error: `${t('code.invalidJson')} ${(failure as Error).message}` });
      return;
    }

    try {
      const { project: next, diagnostics, errors } = reviewJourney(candidate, true);
      if (errors.length) {
        setResult({ diagnostics, error: t('code.invalidFlow') });
        return;
      }
      if (apply) {
        onApply(next);
        onDraftChange(undefined);
      }
      setResult({
        diagnostics,
        status: t(apply ? 'code.applied' : diagnostics.length ? 'code.review' : 'code.valid'),
      });
    } catch (failure) {
      setResult({ error: (failure as Error).message });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setResult((previous) => ({ ...previous, status: t('code.copied') }));
    } catch {
      setResult((previous) => ({ ...previous, status: t('code.copyError') }));
    }
  };

  return (
    <section
      className="code-panel"
      aria-label={t('workspace.code')}
      aria-disabled={disabled || undefined}
    >
      <div className="code-heading">
        <h2>{t('workspace.code')}</h2>
        <p>{t('code.hint')}</p>
      </div>
      <JsonEditor
        label={t('code.label')}
        className="journey-code"
        value={text}
        readOnly={disabled}
        invalid={!!result?.error}
        highlight={highlight}
        reveal={reveal && revealStep ? { offset: reveal.from, request: revealStep } : undefined}
        onNavigate={onSelectStep ? navigate : undefined}
        onChange={(value, offset) => {
          setCursor({ text: value, offset });
          onDraftChange(
            value === current ? undefined : { text: value, base: draft?.base ?? current },
          );
          setResult(undefined);
        }}
      />
      <div className="code-feedback">
        {stale && <FieldError>{t('code.stale')}</FieldError>}
        <FieldError>{result?.error}</FieldError>
        {revealStep && !reveal && <p role="status">{t('code.stepNotFound')}</p>}
        {result?.status && <p role="status">{result.status}</p>}
        {issues.length > 0 && (
          <ul aria-label={t('code.diagnostics')}>
            {issues.map((issue, index) => (
              <li key={index}>
                <strong>{t(`code.${issue.kind}`)} · </strong>
                <code>{issue.path}</code>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="code-actions">
        {cursorStep && onShowStep && (
          <Button variant="ghost" onClick={() => onShowStep(cursorStep)}>
            {t('code.showInEditor')}
          </Button>
        )}
        <Button onClick={() => check(false)} disabled={disabled}>
          {t('code.validate')}
        </Button>
        <Button
          variant="primary"
          onClick={() => check(true)}
          disabled={disabled || !draft || stale}
        >
          {t('code.apply')}
        </Button>
        <Button variant="ghost" onClick={() => void copy()}>
          {t('code.copy')}
        </Button>
        {draft && (
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              onDraftChange(undefined);
              setResult(undefined);
            }}
          >
            {t('code.reload')}
          </Button>
        )}
      </div>
    </section>
  );
}
