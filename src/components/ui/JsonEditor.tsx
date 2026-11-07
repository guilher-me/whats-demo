import { useId, useLayoutEffect, useRef, useState } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { Annotation, Compartment, EditorState, Transaction } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { format } from 'jsonc-parser';
import { useT } from '../../i18n';
import { Button } from './Button';
import { FieldError } from './Field';

const externalChange = Annotation.define<boolean>();
const highlighting = HighlightStyle.define([
  { tag: tags.propertyName, class: 'json-key' },
  { tag: tags.string, class: 'json-string' },
  { tag: tags.number, class: 'json-number' },
  { tag: [tags.bool, tags.null], class: 'json-literal' },
]);

export function JsonEditor({
  label,
  value,
  onChange,
  readOnly = false,
  invalid = false,
  describedBy,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const t = useT();
  const errorId = useId();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>(null);
  const handleChange = useRef(onChange);
  const [settings] = useState(() => new Compartment());
  const [formatError, setFormatError] = useState(false);

  useLayoutEffect(() => {
    handleChange.current = onChange;
  }, [onChange]);

  useLayoutEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      extensions: [
        settings.of([]),
        json(),
        syntaxHighlighting(highlighting),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        indentOnInput(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || update.transactions.some((tr) => tr.annotation(externalChange)))
            return;
          setFormatError(false);
          handleChange.current(update.state.doc.toString());
        }),
      ],
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, [settings]);

  useLayoutEffect(() => {
    const editor = view.current!;
    if (editor.state.doc.toString() === value) return;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      annotations: [externalChange.of(true), Transaction.addToHistory.of(false)],
    });
    setFormatError(false);
  }, [value]);

  useLayoutEffect(() => {
    const description = [describedBy, formatError && errorId].filter(Boolean).join(' ');
    view.current!.dispatch({
      effects: settings.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.contentAttributes.of({
          'aria-label': label,
          ...(description && { 'aria-describedby': description }),
          ...((invalid || formatError) && { 'aria-invalid': 'true' }),
          ...(readOnly && { 'aria-readonly': 'true', tabindex: '0' }),
          spellcheck: 'false',
          autocorrect: 'off',
          autocapitalize: 'off',
          autocomplete: 'off',
        }),
      ]),
    });
  }, [settings, label, readOnly, invalid, describedBy, formatError, errorId]);

  const formatDocument = () => {
    const editor = view.current!;
    const text = editor.state.doc.toString();
    try {
      JSON.parse(text);
    } catch {
      setFormatError(true);
      return;
    }

    // Apply whitespace edits so numbers, escapes and duplicate keys retain their source text.
    const edits = format(text, undefined, { insertSpaces: true, tabSize: 2, eol: '\n' });
    editor.dispatch({
      changes: edits.map(({ offset, length, content }) => ({
        from: offset,
        to: offset + length,
        insert: content,
      })),
      userEvent: 'input.format',
    });
  };

  return (
    <div className={`json-editor ${className}`}>
      <div className="json-editor-toolbar">
        <span>{label}</span>
        <Button variant="ghost" disabled={readOnly} onClick={formatDocument}>
          {t('code.format')}
        </Button>
      </div>
      <div className="json-editor-host" ref={host} />
      <FieldError id={errorId}>{formatError && t('code.formatError')}</FieldError>
    </div>
  );
}
