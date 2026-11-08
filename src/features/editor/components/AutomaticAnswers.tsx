import { useId, useMemo, useState } from 'react';
import type { FlowComponent, FlowStep, Option, Value, Values } from '../../../core/types';
import { walkComponents } from '../../../core/engine';
import { Button } from '../../../components/ui/Button';
import { FieldError, TextArea, TextField } from '../../../components/ui/Field';
import { JsonEditor } from '../../../components/ui/JsonEditor';
import { useT } from '../../../i18n';
import {
  answerFields,
  answerKind,
  answerSuggestion,
  checkAnswer,
  fillMissingAnswers,
  hasAnswerExpression,
  staticAnswerOptions,
} from '../../flows/answers';
import type { JourneyDiagnostic } from '../../flows/diagnostics';
import { BuilderTabs, type BuilderTab } from './BuilderTabs';

function AnswerControl({
  field,
  value,
  options,
  label,
  errorId,
  onChange,
}: {
  field: FlowComponent;
  value: Value;
  options?: Option[];
  label: string;
  errorId?: string;
  onChange: (value: Value) => void;
}) {
  const t = useT();
  const kind = answerKind(field);
  const invalid = errorId ? { 'aria-invalid': true, 'aria-describedby': errorId } : {};
  const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  if (kind === 'boolean')
    return (
      <label className="answers-checkbox">
        <input
          type="checkbox"
          {...invalid}
          checked={value === true}
          onChange={(e) => onChange(e.currentTarget.checked)}
        />
        {label}
      </label>
    );
  if (kind === 'choice')
    return (
      <label className="field">
        <span>{label}</span>
        <select
          {...invalid}
          value={options?.some(({ id }) => id === text) ? text : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        >
          <option value="">{t('answers.noSelection')}</option>
          {options?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </label>
    );
  if (kind === 'multiple') {
    const stored = Array.isArray(value) ? value : [value];
    const selected = options?.filter(({ id }) => stored.includes(id)).map(({ id }) => id) ?? [];
    return (
      <fieldset className="answers-choices" {...invalid}>
        <legend>{label}</legend>
        {options?.map(({ id, title }) => (
          <label className="answers-checkbox" key={id}>
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={(event) =>
                onChange(
                  event.currentTarget.checked
                    ? [...selected, id]
                    : selected.filter((item) => item !== id),
                )
              }
            />
            {title}
          </label>
        ))}
      </fieldset>
    );
  }
  if (kind === 'textarea')
    return (
      <TextArea
        label={label}
        {...invalid}
        rows={2}
        value={text}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    );
  return (
    <TextField
      label={label}
      {...invalid}
      type={kind === 'date' ? 'date' : field['input-type'] === 'email' ? 'email' : 'text'}
      inputMode={field['input-type'] === 'number' ? 'numeric' : undefined}
      value={text}
      onChange={(e) => onChange(e.currentTarget.value)}
    />
  );
}

function AnswerRow({
  field,
  fields,
  value,
  routeIssue,
  onChange,
  onJson,
}: {
  field: FlowComponent;
  fields: FlowComponent[];
  value: Value;
  routeIssue?: string;
  onChange: (value: Value) => void;
  onJson: () => void;
}) {
  const t = useT();
  const errorId = useId();
  const kind = answerKind(field);
  const options = staticAnswerOptions(field);
  const dynamic = (kind === 'choice' || kind === 'multiple') && options === undefined;
  const expression = hasAnswerExpression(value);
  const label = field.label && !hasAnswerExpression(field.label) ? field.label : field.name!;
  const error = dynamic || expression ? routeIssue : checkAnswer(field, value, options).error;
  const suggestion = answerSuggestion(fields);
  return (
    <div className="answer-row">
      <div className="answer-meta">
        <code>{field.name}</code>
        {field.required && <small>{t('common.required')}</small>}
        {fields.length > 1 && <small>{t('answers.shared')}</small>}
      </div>
      {dynamic || expression ? (
        <div className="answer-details">
          <strong>{label}</strong>
          <p>{t(dynamic ? 'answers.dynamic' : 'answers.expression')}</p>
          {value !== undefined && <code>{JSON.stringify(value)}</code>}
          <Button variant="ghost" onClick={onJson}>
            {t('answers.configureJson')}
          </Button>
        </div>
      ) : (
        <AnswerControl
          field={field}
          value={value}
          options={options}
          label={label}
          errorId={error ? errorId : undefined}
          onChange={onChange}
        />
      )}
      <FieldError id={errorId}>{error}</FieldError>
      {suggestion !== undefined && (value == null || value === '' || error) && (
        <Button variant="ghost" onClick={() => onChange(suggestion)}>
          {t('answers.useSuggestion')}
        </Button>
      )}
      {suggestion === undefined && !dynamic && !expression && (value === undefined || error) && (
        <small>{t('answers.noSuggestion')}</small>
      )}
    </div>
  );
}

export function AutomaticAnswers({
  step,
  issues,
  onChange,
}: {
  step: FlowStep;
  issues: JourneyDiagnostic[];
  onChange: (answers: Values) => void;
}) {
  const t = useT();
  const id = useId();
  const [tab, setTab] = useState<BuilderTab>('visual');
  const [jsonOpened, setJsonOpened] = useState(false);
  const [source, setSource] = useState<{ text: string; base?: Values; error?: string }>();
  const fields = useMemo(() => answerFields(step.flow), [step.flow]);
  const error = source?.error;
  const filled = fillMissingAnswers(fields, step.answers);
  const text =
    source && (error || source.base === step.answers)
      ? source.text
      : JSON.stringify(step.answers, null, 2);

  const selectTab = (next: BuilderTab) => {
    setTab(next);
    if (next === 'json') setJsonOpened(true);
    document.getElementById(id + '-' + next)?.focus();
  };
  const editJson = (raw: string) => {
    try {
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error(t('errors.answerObject'));
      const answers = value as Values;
      setSource({ text: raw, base: answers });
      onChange(answers);
    } catch (failure) {
      setSource({ text: raw, error: (failure as Error).message });
    }
  };
  const updateAnswer = (name: string, value: Value) => {
    const answers = { ...step.answers, [name]: value };
    if (value === undefined) delete answers[name];
    onChange(answers);
  };

  return (
    <div className="automatic-answers">
      <BuilderTabs id={id} label={t('editor.autoAnswersTitle')} tab={tab} onSelect={selectTab} />
      <div
        role="tabpanel"
        hidden={tab !== 'visual'}
        id={id + '-panel-visual'}
        aria-labelledby={id + '-visual'}
      >
        {error && <p>{t('answers.readOnly')}</p>}
        {fields.size ? (
          <fieldset className="answer-fields" disabled={!!error}>
            <Button
              variant="ghost"
              disabled={filled === step.answers}
              onClick={() => onChange(filled)}
            >
              {t('answers.fillMissing')}
            </Button>
            {step.flow.screens.map((screen) => {
              const components = walkComponents(screen.layout.children).filter(
                (field) => field.name && answerKind(field),
              );
              return (
                components.length > 0 && (
                  <section
                    className="answers-screen"
                    key={screen.id}
                    aria-label={screen.title || screen.id}
                  >
                    <h4>{screen.title || screen.id}</h4>
                    {components.map((field, index) => {
                      const name = field.name!;
                      return (
                        <AnswerRow
                          key={name + ':' + index}
                          field={field}
                          fields={fields.get(name)!}
                          value={Object.hasOwn(step.answers, name) ? step.answers[name] : undefined}
                          routeIssue={
                            issues.find((issue) => issue.path === 'answers.' + name)?.message
                          }
                          onChange={(value) => updateAnswer(name, value)}
                          onJson={() => selectTab('json')}
                        />
                      );
                    })}
                  </section>
                )
              );
            })}
          </fieldset>
        ) : (
          <p>{t('answers.noFields')}</p>
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
            label={t('editor.answers')}
            value={text}
            className="answers-code"
            invalid={!!error}
            describedBy={error ? id + '-error' : undefined}
            onChange={editJson}
          />
        )}
      </div>
      {error && (
        <div className="builder-draft">
          <FieldError id={id + '-error'}>{error}</FieldError>
          <Button variant="ghost" onClick={() => setSource(undefined)}>
            {t('answers.discard')}
          </Button>
        </div>
      )}
    </div>
  );
}
