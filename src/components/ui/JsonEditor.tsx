import { useId, useLayoutEffect, useRef, useState } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  Annotation,
  Compartment,
  EditorState,
  StateEffect,
  StateField,
  Transaction,
} from '@codemirror/state';
import {
  Decoration,
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
type TextRange = { from: number; to: number };
const setHighlight = StateEffect.define<TextRange | undefined>();
const highlightMark = Decoration.mark({ class: 'json-linked-step' });
const linkedHighlight = StateField.define({
  create: () => Decoration.none,
  update: (decorations, transaction) => {
    for (const effect of transaction.effects) {
      if (effect.is(setHighlight)) {
        const range = effect.value;
        return range ? Decoration.set(highlightMark.range(range.from, range.to)) : Decoration.none;
      }
    }
    return decorations.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});
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
  highlight,
  reveal,
  onNavigate,
}: {
  label: string;
  value: string;
  onChange: (value: string, offset: number) => void;
  readOnly?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  highlight?: TextRange;
  reveal?: { offset: number; request: object };
  onNavigate?: (offset: number) => void;
}) {
  const t = useT();
  const errorId = useId();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>(null);
  const handleChange = useRef(onChange);
  const handleNavigate = useRef(onNavigate);
  const lastReveal = useRef<object>(null);
  const [settings] = useState(() => new Compartment());
  const [formatError, setFormatError] = useState(false);

  useLayoutEffect(() => {
    handleChange.current = onChange;
    handleNavigate.current = onNavigate;
  }, [onChange, onNavigate]);

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
        linkedHighlight,
        EditorView.domEventHandlers({
          click: (event, editor) => {
            if (
              !handleNavigate.current ||
              !(event.target instanceof Node) ||
              !editor.contentDOM.contains(event.target)
            )
              return;
            const clicked = event.detail
              ? editor.posAtCoords({ x: event.clientX, y: event.clientY }, false)
              : undefined;
            handleNavigate.current(clicked ?? editor.state.selection.main.head);
          },
        }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (
            !update.docChanged &&
            update.selectionSet &&
            update.transactions.some(
              (tr) => tr.isUserEvent('select') && !tr.isUserEvent('select.pointer'),
            )
          ) {
            handleNavigate.current?.(update.state.selection.main.head);
          }
          if (!update.docChanged || update.transactions.some((tr) => tr.annotation(externalChange)))
            return;
          setFormatError(false);
          handleChange.current(update.state.doc.toString(), update.state.selection.main.head);
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

  useLayoutEffect(() => {
    view.current!.dispatch({ effects: setHighlight.of(highlight) });
  }, [highlight]);

  useLayoutEffect(() => {
    if (!reveal || lastReveal.current === reveal.request) return;
    lastReveal.current = reveal.request;
    const editor = view.current!;
    const doc = editor.state.doc;
    editor.requestMeasure({
      key: lastReveal,
      read: (view) => {
        if (view.state.doc !== doc) return;
        const line = doc.lineAt(reveal.offset);
        const column = (reveal.offset - line.from) * view.defaultCharacterWidth;
        const gutter = view.scrollDOM.querySelector<HTMLElement>('.cm-gutters')?.offsetWidth ?? 0;
        return {
          top: Math.max(0, view.lineBlockAt(reveal.offset).top - 12),
          left: column + gutter + 16 > view.scrollDOM.clientWidth ? Math.max(0, column - 12) : 0,
        };
      },
      // Keep the workbench and the caret in place when the source is another panel.
      write: (position, view) => {
        if (!position) return;
        view.scrollDOM.scrollTop = position.top;
        view.scrollDOM.scrollLeft = position.left;
      },
    });
  }, [reveal]);

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
