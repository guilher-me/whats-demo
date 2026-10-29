import { useT } from '../../../i18n';
import { useEffect, useId, useState } from 'react';
import type { FlowStep, Values } from '../../../core/types';
import { validateFlow } from '../../../core/engine';
import { TextArea, TextField, FieldError } from '../../../components/ui/Field';
export function FlowStepEditor({
  step,
  onChange,
  onValidity,
}: {
  step: FlowStep;
  onChange: (change: Partial<FlowStep>) => void;
  onValidity: (valid: boolean) => void;
}) {
  const t = useT();

  const errorId = useId();
  const [flow, setFlow] = useState(() => JSON.stringify(step.flow, null, 2)),
    [answers, setAnswers] = useState(() => JSON.stringify(step.answers, null, 2)),
    [errors, setErrors] = useState({ flow: '', answers: '' });
  useEffect(() => {
    onValidity(!errors.flow && !errors.answers);
  }, [errors, onValidity]);
  const edit = (key: 'flow' | 'answers', raw: string) => {
    if (key === 'flow') setFlow(raw);
    else setAnswers(raw);
    try {
      const value: unknown = JSON.parse(raw);
      if (key === 'flow') onChange({ flow: validateFlow(value) });
      else {
        if (!value || typeof value !== 'object' || Array.isArray(value))
          throw new Error(t('errors.answerObject'));
        onChange({ answers: value as Values });
      }
      setErrors((current) => ({ ...current, [key]: '' }));
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: (error as Error).message }));
    }
  };
  return (
    <>
      <TextField
        label={t('editor.buttonText')}
        value={step.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <details className="flow-json">
        <summary>{t('editor.flowJson')}</summary>
        <TextArea
          label="Flow JSON"
          aria-invalid={!!errors.flow}
          aria-describedby={errors.flow ? `${errorId}-flow` : undefined}
          className="json-input"
          value={flow}
          onChange={(e) => edit('flow', e.target.value)}
          spellCheck={false}
        />
        <FieldError id={`${errorId}-flow`}>{errors.flow}</FieldError>
        <TextArea
          label={t('editor.answers')}
          aria-invalid={!!errors.answers}
          aria-describedby={errors.answers ? `${errorId}-answers` : undefined}
          className="json-input answers-input"
          value={answers}
          onChange={(e) => edit('answers', e.target.value)}
          spellCheck={false}
        />
        <FieldError id={`${errorId}-answers`}>{errors.answers}</FieldError>
        <TextField
          label={t('editor.completion')}
          value={step.completion ?? ''}
          onChange={(e) => onChange({ completion: e.target.value })}
        />
      </details>
    </>
  );
}
