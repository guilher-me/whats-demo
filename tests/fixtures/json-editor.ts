import { EditorView } from '@codemirror/view';
import { act } from '@testing-library/react';

export function readJsonEditor(input: HTMLElement) {
  return EditorView.findFromDOM(input)!.state.doc.toString();
}

export function writeJsonEditor(input: HTMLElement, text: string) {
  const editor = EditorView.findFromDOM(input)!;
  act(() => editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } }));
}
