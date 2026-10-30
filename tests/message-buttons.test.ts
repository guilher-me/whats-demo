import { describe, expect, it } from 'vitest';
import {
  buttonType,
  buttonRulesError,
  safeButtonUrl,
  automaticOption,
} from '../src/core/message-buttons';
import { interactiveError } from '../src/core/interactive';
import { encode, decode } from '../src/core/codec';
import { normalizeProject } from '../src/core/project';
import { conversationOverviewMessages } from '../src/features/conversation/overview';
import type { MessageButton, ReplyButtonsMessage, Project } from '../src/core/types';
import legacy from './fixtures/v1-project.json';
const quick = (id: string): MessageButton => ({ id, title: id });
const url = (id = 'site'): MessageButton => ({
  id,
  title: 'Visit site',
  type: 'url',
  url: 'https://example.com/shop',
});
const template = (buttons: MessageButton[]): ReplyButtonsMessage => ({
  kind: 'buttons',
  context: 'template',
  buttons,
});
describe('official button policies', () => {
  it('keeps missing types and contexts compatible with existing quick replies', () => {
    expect(buttonType(quick('old'))).toBe('quick_reply');
    expect(interactiveError({ kind: 'buttons', buttons: [quick('old')] })).toBe('');
    expect(normalizeProject(legacy)).toEqual(legacy);
  });
  it('distinguishes interactive single CTA messages from up to three quick replies', () => {
    expect(interactiveError({ kind: 'buttons', buttons: [url()] })).toBe('');
    expect(interactiveError({ kind: 'buttons', buttons: [quick('a'), url()] })).toContain('único');
    expect(
      interactiveError({
        kind: 'buttons',
        buttons: [{ id: 'call', title: 'Call', type: 'phone_number', phoneNumber: '+15551234567' }],
      }),
    ).toContain('template');
    expect(
      interactiveError({ kind: 'buttons', buttons: [{ id: 'a', title: 'x'.repeat(21) }] }),
    ).not.toBe('');
  });
  it('allows ten template replies with 25-character labels, not eleven or 26 characters', () => {
    const message = template(Array.from({ length: 10 }, (_, i) => quick(String(i))));
    message.buttons[0].title = 'x'.repeat(25);
    expect(interactiveError(message)).toBe('');
    message.buttons.push(quick('11'));
    expect(interactiveError(message)).toContain('10');
    message.buttons.pop();
    message.buttons[0].title = 'x'.repeat(26);
    expect(interactiveError(message)).not.toBe('');
  });
  it.each([
    [quick('a'), quick('b'), url()],
    [url(), quick('a'), quick('b')],
  ])('permits two contiguous button groups', (...buttons) => {
    expect(interactiveError(template(buttons))).toBe('');
  });
  it.each([
    [quick('a'), url(), quick('b')],
    [url('one'), quick('a'), url('two')],
  ])('rejects alternating groups but preserves an editable draft', (...buttons) => {
    const message = template(buttons);
    expect(interactiveError(message)).toContain('Agrupe');
    expect(interactiveError(message, { allowDrafts: true })).toBe('');
  });
  it.each(['url', 'phone_number', 'copy_code'] as const)(
    'enforces per-type counts for %s',
    (type) => {
      const sample: MessageButton = {
        id: 'a',
        title: 'Action',
        type,
        url: 'https://example.com',
        phoneNumber: '+15551234567',
        code: 'CODE',
      };
      const count = type === 'url' ? 3 : 2;
      expect(
        interactiveError(
          template(Array.from({ length: count }, (_, i) => ({ ...sample, id: String(i) }))),
        ),
      ).toContain('no máximo');
    },
  );
  it.each([
    'javascript:alert(1)',
    'data:text/html,evil',
    'file:///secret',
    'https://user:password@example.com',
    '//example.com',
    'https://example.com/{{1}}',
    'https://example.com/\nfoo',
    'https://example.com/' + 'x'.repeat(2000),
  ])('rejects unsafe or unresolved URLs: %s', (value) => {
    expect(safeButtonUrl(value)).toBeNull();
    expect(interactiveError(template([{ ...url(), url: value }]))).not.toBe('');
  });
  it('accepts fully resolved URLs and validates phone, copy code and call TTL', () => {
    expect(safeButtonUrl('https://example.com/?name=Gon%C3%A7alves')).toBeTruthy();
    const phone: MessageButton = {
      id: 'phone',
      title: 'Call',
      type: 'phone_number',
      phoneNumber: '+1234567890123456789',
    };
    const code: MessageButton = {
      id: 'copy',
      title: 'Copy code',
      type: 'copy_code',
      code: 'x'.repeat(20),
    };
    const call: MessageButton = {
      id: 'wa',
      title: 'Call WhatsApp',
      type: 'voice_call',
      ttlMinutes: 1440,
    };
    expect(interactiveError(template([phone, code, call]))).toBe('');
    expect(
      interactiveError(template([{ ...phone, phoneNumber: phone.phoneNumber + '1' }])),
    ).not.toBe('');
    expect(interactiveError(template([{ ...code, code: '' }]))).not.toBe('');
    expect(interactiveError(template([{ ...code, code: 'x'.repeat(21) }]))).not.toBe('');
    expect(interactiveError(template([{ ...call, ttlMinutes: 1439 }]))).not.toBe('');
    expect(interactiveError({ kind: 'buttons', buttons: [{ ...call, ttlMinutes: 1 }] })).toBe('');
    expect(
      interactiveError({ kind: 'buttons', buttons: [{ ...call, ttlMinutes: 43201 }] }),
    ).not.toBe('');
    expect(interactiveError(template([{ ...call, title: 'x'.repeat(21) }]))).not.toBe('');
  });
  it('rejects unknown types and malformed typed fields even in drafts', () => {
    for (const button of [
      { ...url(), type: 'execute' },
      { ...url(), url: {} },
      { ...url(), ttlMinutes: Infinity },
    ])
      expect(
        interactiveError({ kind: 'buttons', buttons: [button] }, { allowDrafts: true }),
      ).not.toBe('');
  });
  it('saves unfinished destinations without enabling playback', () => {
    const message = template([{ ...url(), url: '' }]);
    expect(interactiveError(message, { allowDrafts: true })).toBe('');
    expect(interactiveError(message)).not.toBe('');
  });
  it('uses quick replies for autoplay when CTAs appear first, without inventing CTA reply bubbles', () => {
    const message = template([url(), quick('yes')]);
    expect(automaticOption(message)?.id).toBe('yes');
    expect(buttonRulesError({ ...message, autoReplyId: 'site' })).not.toBe('');
    const project = normalizeProject(legacy);
    project.steps = [
      { id: 'action', type: 'business', text: 'Shop', delay: 0, interactive: template([url()]) },
    ];
    expect(conversationOverviewMessages(project)).toHaveLength(1);
    if (project.steps[0].type !== 'business') throw new Error('fixture');
    project.steps[0].interactive = message;
    expect(conversationOverviewMessages(project).map((m) => m.text)).toEqual(['Shop', 'yes']);
  });
  it('round-trips typed buttons through v1 shared links', async () => {
    const project: Project = normalizeProject(legacy);
    project.steps = [
      {
        id: 'buttons',
        type: 'business',
        text: 'Choose',
        delay: 0,
        interactive: template([
          url(),
          { id: 'code', title: 'Copy code', type: 'copy_code', code: 'SAVE10' },
          quick('yes'),
        ]),
      },
    ];
    expect(normalizeProject(await decode(await encode(project)))).toEqual(project);
  });
});
