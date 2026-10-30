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
function Harness() {
  const [value, setValue] = useState(steps);
  return (
    <>
      <SortableSteps steps={value} onChange={setValue}>
        {(step, _index, handle) => (
          <article>
            {handle}
            <p>{step.text}</p>
          </article>
        )}
      </SortableSteps>
      <output data-testid="steps">{JSON.stringify(value)}</output>
    </>
  );
}
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const row = this.closest('.sortable-step');
    const index = row ? Array.from(row.parentElement!.children).indexOf(row) : 0;
    return {
      x: 0,
      y: index * 100,
      top: index * 100,
      left: 0,
      right: 400,
      bottom: (index + 1) * 100,
      width: 400,
      height: row ? 100 : 200,
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
