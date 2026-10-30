import { it, expect } from 'vitest';
import { createDefaultProject } from '../src/core/defaults';
import { exportDocument, importDocument, SCHEMA_VERSION } from '../src/core/document';
import { createInteractive } from '../src/core/interactive';
it('round trips the complete showcase including native Flow JSON and logo', () => {
  const project = createDefaultProject(),
    doc = exportDocument(project),
    next = importDocument(doc);
  expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
  expect(next.contact).toEqual(project.contact);
  expect(next.steps.map((s) => s.text)).toEqual(project.steps.map((s) => s.text));
  expect(exportDocument(next)).toEqual(doc);
});
it('round trips typed templates, URL actions and lists', () => {
  const project = createDefaultProject();
  project.contact.avatar = '';
  project.steps = [
    {
      id: 'a',
      type: 'business',
      text: 'Offer',
      delay: 1,
      interactive: {
        kind: 'buttons',
        context: 'template',
        buttons: [
          { id: 'u', title: 'Shop', type: 'url', url: 'https://example.com' },
          { id: 'q', title: 'Yes' },
        ],
      },
    },
    {
      id: 'b',
      type: 'business',
      text: 'Site',
      delay: 0,
      interactive: {
        kind: 'buttons',
        buttons: [{ id: 'url', type: 'url', title: 'Visit', url: 'https://example.com' }],
      },
    },
    { id: 'c', type: 'business', text: 'List', delay: 0, interactive: createInteractive('list') },
  ];
  const doc = exportDocument(project);
  expect(exportDocument(importDocument(doc))).toEqual(doc);
});
it('rejects old versions, missing references, duplicate IDs and unsafe objects', () => {
  const project = createDefaultProject(),
    doc = exportDocument(project);
  expect(() => importDocument(project)).toThrow();
  expect(() => importDocument({ ...doc, schemaVersion: '2.0.0' })).toThrow();
  expect(() =>
    importDocument({ ...doc, resources: { assets: {}, flows: {}, templates: {} } }),
  ).toThrow();
  const duplicate = structuredClone(doc);
  duplicate.journey.steps.push(duplicate.journey.steps[0]);
  expect(() => importDocument(duplicate)).toThrow();
  expect(() => importDocument(JSON.parse('{"__proto__":{}}'))).toThrow();
});
