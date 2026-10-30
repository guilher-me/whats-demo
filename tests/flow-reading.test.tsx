// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { flowReadingText } from '../src/features/flows/reading';

const { events } = vi.hoisted(() => ({ events: [] as string[] }));
vi.mock('../src/features/playback/hooks/useCursor', () => ({
  useCursor: () => ({
    cursor: { x: 0, y: 0, visible: false, pressed: false },
    hide: () => {},
    read: async (text: string) => {
      events.push(`read:${text}`);
    },
    type: async (
      element: HTMLElement,
      text: string,
      _signal: AbortSignal,
      update: (value: string) => void,
    ) => {
      events.push(`fill:${element.dataset.field}:${text}`);
      update(text);
    },
    touch: async (element: HTMLElement, _signal: AbortSignal, action?: () => void) => {
      events.push(element.hasAttribute('data-flow-next') ? 'submit' : 'open');
      action?.();
    },
  }),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('reads and fills each field in order instead of reading the entire Flow first', async () => {
  vi.useFakeTimers();
  localStorage.clear();
  events.length = 0;
  render(<App />);
  await act(async () => {});
  act(() =>
    window.whatsappFakeFlows!.loadProject({
      version: 1,
      contact: { name: 'Store', avatar: '', verified: false },
      steps: [
        {
          id: 'form',
          type: 'flow',
          text: 'Please share your details.',
          delay: 0,
          label: 'Open',
          answers: { first: 'Alex', last: 'Taylor' },
          flow: {
            version: '7.3',
            screens: [
              {
                id: 'DETAILS',
                title: 'Contact',
                terminal: true,
                layout: {
                  type: 'SingleColumnLayout',
                  children: [
                    { type: 'TextHeading', text: 'Your details' },
                    { type: 'TextInput', name: 'first', label: 'First name', required: true },
                    { type: 'TextInput', name: 'last', label: 'Last name', required: true },
                    {
                      type: 'Footer',
                      label: 'Send',
                      'on-click-action': {
                        name: 'complete',
                        payload: { first: '${form.first}', last: '${form.last}' },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }),
  );
  let run!: Promise<unknown>;
  act(() => {
    run = window.whatsappFakeFlows!.play();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  await run;
  expect(events.slice(events.indexOf('read:Contact'))).toEqual([
    'read:Contact',
    'read:Your details',
    'read:First name',
    'fill:first:Alex',
    'read:Last name',
    'fill:last:Taylor',
    'read:Send',
    'submit',
  ]);
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
});

it('includes only the current field and its resolved choices and helper text', () => {
  expect(
    flowReadingText(
      {
        type: 'RadioButtonsGroup',
        label: '${data.label}',
        'helper-text': 'Select one finish.',
        'data-source': '${data.choices}',
      },
      {
        data: {
          label: 'Color',
          choices: [
            { id: 'sand', title: 'Warm sand' },
            { id: 'green', title: 'Forest green' },
          ],
        },
        form: {},
      },
    ),
  ).toBe('Color Select one finish. Warm sand Forest green');
});
