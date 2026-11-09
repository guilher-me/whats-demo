import { describe, expect, it, vi } from 'vitest';
import {
  resolveVariableMessage,
  variableIssues,
  variablePath,
} from '../src/core/journey-variables';
import { captureFlowVariables } from '../src/features/flows/journey-variables';
import { advance, createSession, goBack } from '../src/features/flows/model';
import { validateProject } from '../src/core/engine';
import { createStep, normalizeProject } from '../src/core/project';
import { previousVariablesWithExamples } from '../src/features/conversation/overview';
import type { FlowStep, MessageStep, Project } from '../src/core/types';

const message = (text: string): MessageStep => ({ id: 'reply', type: 'business', delay: 0, text });
const chat: MessageStep = { id: 'name', type: 'user', delay: 0, text: 'Alex' };
const project = (...steps: Project['steps']): Project => ({
  version: 1,
  contact: { name: 'Loja', verified: false },
  steps,
});

describe('journey variables', () => {
  it('assigns compact IDs without recycling an existing ID or a dangling reference', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const first = { ...chat, id: 'N-000' };
    const reply = message('{{chat.N-001.text}}');
    const cart: MessageStep = {
      ...chat,
      id: 'cart',
      commerce: { kind: 'cart', offerId: 'N-002' },
    };
    expect(createStep('business', [first, reply, cart]).id).toBe('N-003');
    const normalized = normalizeProject(
      project(first, { ...chat, id: '' }, { ...chat, id: 'N-001' }, chat, first),
    );
    expect(normalized.steps.map(({ id }) => id)).toEqual([
      'N-000',
      'N-002',
      'N-001',
      'name',
      'N-003',
    ]);
  });

  it('offers configured examples for chat, choice, Flow and location variables', () => {
    const flow = { ...createStep('flow'), id: 'N-form', answers: { name: 'Lia' } };
    const choice: MessageStep = {
      ...message('Choose'),
      interactive: {
        kind: 'list',
        button: 'Choose delivery',
        autoReplyId: 'pickup',
        sections: [{ title: 'Options', rows: [{ id: 'pickup', title: 'Retirada' }] }],
      },
    };
    const location: MessageStep = {
      ...chat,
      id: 'location',
      media: { kind: 'location', place: { name: 'Loja' } },
    };
    const draft = project(chat, choice, flow, location, message(''));
    const examples = previousVariablesWithExamples(draft, 4);
    expect(Object.fromEntries(examples.map(({ path, example }) => [path, example]))).toEqual({
      'chat.name.text': 'Alex',
      'choice.reply.title': 'Retirada',
      'choice.reply.id': 'pickup',
      'flow.N-form.FORM_SCREEN.name': 'Lia',
      'location.location.name': 'Loja',
      'location.location.address': '',
    });
  });

  it('resolves quoted paths and fallbacks once, preserving legacy placeholders and literal response text', () => {
    const path = variablePath('flow', 'cadastro.v2', 'FORM_SCREEN', 'name');
    expect(path).toBe('flow["cadastro.v2"].FORM_SCREEN.name');
    const resolved = resolveVariableMessage(
      message('*{{' + path + '}}* {{1}} {{chat.name.text ?? "cliente }} aqui"}}'),
      new Map([[path, '<img> _literal_ {{1}}']]),
    );
    expect(resolved?.text).toBe('<img> _literal_ {{1}} {{1}} cliente }} aqui');
    expect(resolved?.formattedText?.[0]).toEqual({
      type: 'bold',
      children: [{ type: 'text', text: '<img> _literal_ {{1}}' }],
    });
  });

  it('keeps stable IDs after reorder and rejects malformed, missing and forward references', () => {
    const reply = message('Hi {{chat.name.text}}');
    expect(variableIssues(project(chat, reply))).toEqual([]);
    expect(variableIssues(project(reply, chat))).toMatchObject([
      { path: 'steps[0].text', severity: 'error' },
    ]);
    expect(() => validateProject(project(reply))).toThrow('steps[0].text');
    expect(variableIssues(project(chat, chat, reply))).toMatchObject([
      { path: 'steps', severity: 'error' },
    ]);
    expect(() => validateProject(project(reply), { allowDrafts: true })).not.toThrow();
    expect(variableIssues(project(chat, message('{{chat.name.text ?? bad}}')))).toMatchObject([
      { severity: 'error' },
    ]);
    expect(variableIssues(project(chat, message('{{1}} {{customer_name}}')))).toEqual([]);
  });

  it('caps expanded captions without splitting Unicode characters', () => {
    const step = {
      ...message(''),
      media: {
        kind: 'image' as const,
        file: { name: 'Demo', extension: 'jpg' as const },
        caption: 'A{{chat.name.text}}!',
      },
    };
    const resolved = resolveVariableMessage(step, new Map([['chat.name.text', '😊'.repeat(600)]]));
    expect(resolved?.text).toBe('A' + '😊'.repeat(511));
  });

  it('uses only the completed route and separates Flows with the same screen and field IDs', () => {
    const field = { type: 'TextInput', name: 'name', label: 'Nome' };
    const flow: FlowStep = {
      id: 'form-a',
      type: 'flow',
      text: '',
      label: 'Open',
      delay: 0,
      answers: {},
      flow: {
        version: '7.2',
        screens: [
          {
            id: 'FORM_SCREEN',
            title: 'Nome',
            layout: {
              type: 'SingleColumnLayout',
              children: [
                field,
                {
                  type: 'If',
                  condition: '${form.name} == "Ana"',
                  then: [
                    {
                      type: 'Footer',
                      label: 'Next',
                      'on-click-action': {
                        name: 'navigate',
                        next: { type: 'screen', name: 'ALTERNATE' },
                      },
                    },
                  ],
                  else: [
                    {
                      type: 'Footer',
                      label: 'Next',
                      'on-click-action': {
                        name: 'navigate',
                        next: { type: 'screen', name: 'DETAIL' },
                      },
                    },
                  ],
                },
              ],
            },
          },
          {
            id: 'DETAIL',
            title: 'Detalhes',
            terminal: true,
            layout: {
              type: 'SingleColumnLayout',
              children: [
                { type: 'TextInput', name: 'secret', label: 'Secret', visible: false },
                {
                  type: 'CheckboxGroup',
                  name: 'services',
                  label: 'Services',
                  'data-source': [
                    { id: 'a', title: 'Entrega' },
                    { id: 'b', title: 'Retirada' },
                  ],
                },
                { type: 'Footer', label: 'Finish', 'on-click-action': { name: 'complete' } },
              ],
            },
          },
          {
            id: 'ALTERNATE',
            title: 'Alternate',
            terminal: true,
            layout: {
              type: 'SingleColumnLayout',
              children: [
                { type: 'TextInput', name: 'other', label: 'Other' },
                { type: 'Footer', label: 'Finish', 'on-click-action': { name: 'complete' } },
              ],
            },
          },
        ],
      },
    };
    const first = { ...createSession(flow), form: { name: 'Ana' } };
    const abandoned = advance(first).session!;
    const back = goBack({ ...abandoned, form: { other: 'discarded' } });
    const completed = {
      ...advance({ ...back, form: { name: 'Bea' } }).session!,
      form: { secret: 'hidden', services: ['a', 'b'] },
    };
    expect(advance(completed).complete).toBeDefined();
    const values = new Map<string, string>();
    captureFlowVariables(completed, values);
    const second = {
      ...completed,
      step: { ...flow, id: 'form-b' },
      history: [{ ...completed.history[0], form: { name: 'Cris' } }],
    };
    captureFlowVariables(second, values);
    expect(values.get('flow.form-a.FORM_SCREEN.name')).toBe('Bea');
    expect(values.get('flow.form-b.FORM_SCREEN.name')).toBe('Cris');
    expect(values.get('flow.form-a.DETAIL.services')).toBe('Entrega, Retirada');
    expect(values.has('flow.form-a.DETAIL.secret')).toBe(false);
    expect(
      resolveVariableMessage(message('{{flow.form-a.ALTERNATE.other ?? "skipped"}}'), values)?.text,
    ).toBe('skipped');
  });
});
