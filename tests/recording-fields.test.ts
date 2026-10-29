// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { copyLiveField, restoreTextAreas } from '../src/features/recording/capture';
it('reflete o estado atual de checkboxes, radios e opções no HTML serializado', () => {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = true;
  const clone = input.cloneNode() as HTMLInputElement;
  copyLiveField(input, clone, true);
  expect(clone.hasAttribute('checked')).toBe(true);
  input.checked = false;
  copyLiveField(input, clone, true);
  expect(clone.hasAttribute('checked')).toBe(false);
  const option = document.createElement('option');
  option.selected = true;
  const optionClone = option.cloneNode() as HTMLOptionElement;
  copyLiveField(option, optionClone, true);
  expect(optionClone.hasAttribute('selected')).toBe(true);
});
it('preserva o valor do textarea como texto, incluindo sinais de HTML', () => {
  const original = document.createElement('textarea');
  original.value = '<b>texto</b> & valores';
  const clone = original.cloneNode() as HTMLTextAreaElement;
  copyLiveField(original, clone, true);
  const root = document.createElement('div');
  root.append(clone);
  restoreTextAreas(root);
  expect(clone.textContent).toBe(original.value);
  expect(clone.querySelector('b')).toBeNull();
  expect(clone.hasAttribute('data-captured-text')).toBe(false);
});
