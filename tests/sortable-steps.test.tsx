// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SortableSteps } from '../src/features/editor/components/SortableSteps';
import { createStep } from '../src/core/project';
import type { Step } from '../src/core/types';
const steps: Step[] = [
  { ...createStep('flow'), id: 'form' },
  { id: 'reply', type: 'business', text: 'Reply', delay: 1 },
];
let unequalHeights = false;
function Harness({ reverse = false }: { reverse?: boolean }) {
  const [value, setValue] = useState(reverse ? [steps[1], steps[0]] : steps);
  return (
    <>
      <SortableSteps steps={value} onChange={setValue}>
        {(step, _index, handle) => (
          <article data-height={step.id === 'form' ? 360 : 70}>
            {handle}
            <p>{step.text}</p>
            {step.id === 'form' && (
              <textarea aria-label="Flow draft" defaultValue="Unsaved field value" />
            )}
          </article>
        )}
      </SortableSteps>
      <output data-testid="steps">{JSON.stringify(value)}</output>
    </>
  );
}
beforeEach(() => {
  unequalHeights = false;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const row = this.closest('.sortable-step');
    const index = row ? Array.from(row.parentElement!.children).indexOf(row) : 0;
    const rows = row ? Array.from(row.parentElement!.children) : [];
    const heights = rows.map((node) =>
      unequalHeights ? Number(node.querySelector('article')?.dataset.height) : 100,
    );
    const top = heights.slice(0, index).reduce((a, b) => a + b, 0);
    const height = row ? heights[index] : 430;
    return {
      x: 0,
      y: top,
      top,
      left: 0,
      right: 400,
      bottom: top + height,
      width: 400,
      height,
      toJSON() {},
    };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it.each([false, true])(
  'supports keyboard journey reordering and Escape cancellation: %s',
  async (cancel) => {
    render(<Harness />);
    const handle = screen.getByRole('button', { name: 'Reordenar etapa 1' });
    handle.focus();
    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.keyDown(document, { code: 'ArrowDown', key: 'ArrowDown' });
    await waitFor(() =>
      expect(document.querySelector('[role="status"]')).toHaveTextContent('Posição 2'),
    );
    fireEvent.keyDown(document, {
      code: cancel ? 'Escape' : 'Space',
      key: cancel ? 'Escape' : ' ',
    });
    await waitFor(() => expect(handle).not.toHaveAttribute('aria-pressed', 'true'));
    expect(JSON.parse(screen.getByTestId('steps').textContent!)).toEqual(
      cancel ? steps : [steps[1], steps[0]],
    );
  },
);

it.each([
  ['closed over expanded upward', false, 2, 'ArrowUp', 1, false],
  ['closed over expanded downward', true, 1, 'ArrowDown', 2, false],
  ['cancel closed over expanded', false, 2, 'ArrowUp', 1, true],
] as const)(
  'keeps the original dimensions with unequal heights: %s',
  async (_scenario, reverse, from, direction, to, cancel) => {
    unequalHeights = true;
    const initial = reverse ? [steps[1], steps[0]] : steps;
    render(<Harness reverse={reverse} />);
    const draft = screen.getByLabelText('Flow draft');
    fireEvent.change(draft, { target: { value: 'Edited form value' } });
    const handle = screen.getByRole('button', { name: 'Reordenar etapa ' + from });
    handle.focus();
    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.keyDown(document, { code: direction, key: direction });
    await waitFor(() =>
      expect(document.querySelector('[role="status"]')).toHaveTextContent('Posição ' + to),
    );
    const moving = document.querySelector<HTMLElement>('.sortable-step.is-dragging')!;
    expect(moving.style.transform).toContain('translate3d(');
    expect(moving.style.transform).not.toContain('scale');
    expect(draft).toHaveValue('Edited form value');
    fireEvent.keyDown(document, {
      code: cancel ? 'Escape' : 'Space',
      key: cancel ? 'Escape' : ' ',
    });
    await waitFor(() => expect(handle).not.toHaveAttribute('aria-pressed', 'true'));
    expect(JSON.parse(screen.getByTestId('steps').textContent!)).toEqual(
      cancel ? initial : [...initial].reverse(),
    );
    expect(screen.getByLabelText('Flow draft')).toBe(draft);
    expect(draft).toHaveValue('Edited form value');
  },
);
