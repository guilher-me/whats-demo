import type { Project, Step, MessageButton, BusinessInteractive } from './types';
import { normalizeProject } from './project';
import { sanitizeAvatar, prepareProjectImages } from './images/sanitize';
import { DEFAULT_AVATAR, trustedAvatar } from './avatarAssets';
import { buttonType } from './message-buttons';
export const SCHEMA_VERSION = '1.0.0-alpha.1';
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
type ObjectValue = Record<string, any>;
export interface ExperienceDocument {
  format: 'whatsdemo';
  schemaVersion: typeof SCHEMA_VERSION;
  metadata: { id: string; title: string; contentLocale: string };
  participants: Record<string, ObjectValue>;
  resources: {
    assets: Record<string, ObjectValue>;
    flows: Record<string, ObjectValue>;
    templates: Record<string, ObjectValue>;
  };
  journey: { steps: ObjectValue[] };
  playback: { userPace: number };
  extensions?: Record<string, unknown>;
}
const fail = (): never => {
  throw new Error('Invalid WhatsDemo document or unsupported component.');
};
const obj = (x: unknown): ObjectValue =>
  x && typeof x === 'object' && !Array.isArray(x) ? (x as ObjectValue) : fail();
const str = (x: unknown): string => (typeof x === 'string' ? x : fail());
const map = (x: unknown) => obj(x ?? {});
export function exportDocument(project: Project): ExperienceDocument {
  const saved = project.document;
  const resources: ExperienceDocument['resources'] = {
    assets:
      saved?.customer?.avatarAssetId &&
      saved?.resources?.assets?.[String(saved.customer.avatarAssetId)]
        ? {
            [String(saved.customer.avatarAssetId)]:
              saved.resources.assets[String(saved.customer.avatarAssetId)],
          }
        : {},
    flows: { ...(saved?.resources?.flows ?? {}) },
    templates: { ...(saved?.resources?.templates ?? {}) },
  };
  const business: ObjectValue = {
    type: 'business',
    name: project.contact.name,
    verified: project.contact.verified,
  };
  if (project.contact.avatar) {
    const source = trustedAvatar(project.contact.avatar) ?? project.contact.avatar;
    const owned = source === DEFAULT_AVATAR;
    const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(source);
    if (owned)
      resources.assets.avatar = { type: 'builtin', name: 'luma-home', source: DEFAULT_AVATAR };
    else {
      if (!match) throw new Error('Export requires a normalized embedded profile image.');
      resources.assets.avatar = { mimeType: match[1], encoding: 'base64', data: match[2] };
    }
    business.avatarAssetId = 'avatar';
  }
  const steps = project.steps.map((step) => {
    let message: ObjectValue = { type: 'text', text: { body: step.text } };
    const simulation: ObjectValue = {
      beforeMs: Math.round(step.delay * 1000),
      typingEnabled: step.typing ?? true,
      ...(step.typingMs !== undefined ? { typingMs: step.typingMs } : {}),
    };
    let bindings: ObjectValue | undefined;
    if (step.type === 'flow') {
      const name =
        step.resourceId ??
        'flow_' +
          Array.from(new TextEncoder().encode(step.id), (b) =>
            b.toString(16).padStart(2, '0'),
          ).join('');
      resources.flows[name] = { definition: step.flow };
      bindings = { flowId: name };
      message = {
        type: 'interactive',
        interactive: {
          type: 'flow',
          body: { text: step.text },
          action: {
            name: 'flow',
            parameters: {
              flow_message_version: '3',
              flow_name: name,
              flow_cta: step.label,
              flow_action: 'navigate',
            },
          },
        },
      };
      simulation.autoResponse = {
        type: 'complete_flow',
        valuesByScreen: Object.fromEntries(
          step.flow.screens.map((screen) => [
            screen.id,
            Object.fromEntries(
              Object.entries(step.answers).filter(([key]) =>
                JSON.stringify(screen.layout).includes('"name":"' + key + '"'),
              ),
            ),
          ]),
        ),
      };
      simulation.completionText = step.completion ?? '';
    } else if (step.interactive) {
      const v = step.interactive;
      simulation.autoResponse = { type: 'select_reply', replyId: v.autoReplyId ?? '' };
      if (
        v.kind === 'buttons' &&
        (v.context === 'template' ||
          (v.buttons.some((b) => buttonType(b) !== 'quick_reply') &&
            (v.buttons.length !== 1 ||
              ['phone_number', 'copy_code'].includes(buttonType(v.buttons[0])))))
      ) {
        const name =
          step.resourceId ??
          'template_' +
            Array.from(new TextEncoder().encode(step.id), (b) =>
              b.toString(16).padStart(2, '0'),
            ).join('');
        bindings = { templateId: name };
        simulation.editorContext = v.context ?? 'interactive';
        resources.templates[name] = {
          definition: {
            name,
            language: saved?.resources?.templates?.[name]?.definition?.language ?? 'en_US',
            category: saved?.resources?.templates?.[name]?.definition?.category ?? 'MARKETING',
            components: [
              ...(v.header ? [{ type: 'HEADER', format: 'TEXT', text: v.header }] : []),
              { type: 'BODY', text: step.text },
              ...(v.footer ? [{ type: 'FOOTER', text: v.footer }] : []),
              {
                type: 'BUTTONS',
                buttons: v.buttons.map((b) => ({
                  type: buttonType(b).toUpperCase(),
                  ...(buttonType(b) === 'copy_code'
                    ? { example: b.code ?? '' }
                    : { text: b.title }),
                  ...(b.url !== undefined ? { url: b.url } : {}),
                  ...(b.phoneNumber !== undefined ? { phone_number: b.phoneNumber } : {}),
                  ...(b.ttlMinutes !== undefined ? { ttl_minutes: b.ttlMinutes } : {}),
                })),
              },
            ],
          },
        };
        simulation.buttonIds = v.buttons.map((b) => b.id);
        message = {
          type: 'template',
          template: { name, language: { code: resources.templates[name].definition.language } },
        };
      } else {
        const interactive: ObjectValue = {
          type: 'button',
          body: { text: step.text },
          ...(v.header ? { header: { type: 'text', text: v.header } } : {}),
          ...(v.footer ? { footer: { text: v.footer } } : {}),
        };
        if (v.kind === 'list') {
          interactive.type = 'list';
          interactive.action = { button: v.button, sections: v.sections };
        } else if (v.buttons.some((b) => buttonType(b) !== 'quick_reply')) {
          const b = v.buttons[0];
          if (v.buttons.length !== 1)
            throw new Error('Correct interactive button combinations before exporting.');
          interactive.type = buttonType(b) === 'url' ? 'cta_url' : 'voice_call';
          interactive.action = {
            name: interactive.type,
            parameters: {
              display_text: b.title,
              ...(interactive.type === 'cta_url'
                ? { url: b.url ?? '' }
                : b.ttlMinutes !== undefined
                  ? { ttl_minutes: b.ttlMinutes }
                  : {}),
            },
          };
          simulation.buttonIds = [b.id];
        } else
          interactive.action = {
            buttons: v.buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
          };
        message = { type: 'interactive', interactive };
      }
    }
    return {
      id: step.id,
      kind: 'message',
      sender: step.type === 'user' ? 'customer' : 'business',
      message,
      simulation,
      ...(bindings ? { bindings } : {}),
    };
  });
  return {
    format: 'whatsdemo',
    schemaVersion: SCHEMA_VERSION,
    metadata: saved?.metadata ?? {
      id: 'experience',
      title: project.contact.name,
      contentLocale: 'en-US',
    },
    participants: { business, customer: saved?.customer ?? { type: 'customer', name: 'Customer' } },
    resources,
    journey: { steps },
    playback: saved?.playback ?? { userPace: 1 },
    ...(saved?.extensions ? { extensions: saved.extensions } : {}),
  };
}
export function importDocument(input: unknown): Project {
  const scan = (value: unknown, depth = 0): void => {
    if (depth > 50) throw new Error('Document nesting limit exceeded.');
    if (value && typeof value === 'object')
      for (const [key, item] of Object.entries(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) fail();
        scan(item, depth + 1);
      }
  };
  scan(input);
  const d = obj(input);
  if (d.format !== 'whatsdemo' || d.schemaVersion !== SCHEMA_VERSION)
    throw new Error('Unsupported WhatsDemo file format or schema version.');
  const meta = obj(d.metadata),
    actors = obj(d.participants),
    business = obj(actors.business),
    customer = obj(actors.customer),
    resources = obj(d.resources),
    assets = obj(resources.assets),
    flows = obj(resources.flows),
    templates = obj(resources.templates),
    playback = obj(d.playback);
  str(meta.id);
  str(meta.title);
  str(meta.contentLocale);
  str(customer.name);
  if (
    business.type !== 'business' ||
    customer.type !== 'customer' ||
    typeof business.verified !== 'boolean' ||
    typeof playback.userPace !== 'number' ||
    !Number.isFinite(playback.userPace) ||
    ![0.5, 1, 1.5, 2, 3].includes(playback.userPace)
  )
    fail();
  let avatar = '';
  if (business.avatarAssetId !== undefined) {
    const a = obj(assets[str(business.avatarAssetId)]);
    if (a.type === 'builtin') {
      if (a.name !== 'luma-home' || a.source !== DEFAULT_AVATAR) fail();
      avatar = DEFAULT_AVATAR;
    } else {
      if (
        a.encoding !== 'base64' ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(a.mimeType)
      )
        fail();
      avatar = 'data:' + a.mimeType + ';base64,' + str(a.data);
    }
  }
  const list = obj(d.journey).steps;
  if (!Array.isArray(list) || list.length > 200) fail();
  const ids = new Set<string>();
  const steps: Step[] = list.map((raw: unknown) => {
    const s = obj(raw),
      m = obj(s.message),
      sim = map(s.simulation),
      binding = map(s.bindings),
      id = str(s.id);
    if (!id || ids.has(id) || s.kind !== 'message' || !['business', 'customer'].includes(s.sender))
      fail();
    ids.add(id);
    const delay = sim.beforeMs ?? 0;
    if (!Number.isInteger(delay) || delay < 0 || delay > 120000) fail();
    if (sim.typingEnabled !== undefined && typeof sim.typingEnabled !== 'boolean') fail();
    if (
      sim.typingMs !== undefined &&
      (!Number.isInteger(sim.typingMs) || sim.typingMs < 0 || sim.typingMs > 120000)
    )
      fail();
    const base = {
      id,
      type: s.sender === 'customer' ? ('user' as const) : ('business' as const),
      text: '',
      delay: delay / 1000,
      typing: sim.typingEnabled ?? true,
      ...(sim.typingMs !== undefined ? { typingMs: sim.typingMs } : {}),
      ...(binding.flowId || binding.templateId
        ? { resourceId: str(binding.flowId ?? binding.templateId) }
        : {}),
    };
    if (m.type === 'text') return { ...base, text: str(obj(m.text).body) };
    if (s.sender !== 'business') fail();
    const auto = sim.autoResponse === undefined ? undefined : obj(sim.autoResponse);
    let interactive!: BusinessInteractive;
    if (m.type === 'template') {
      const t = obj(m.template),
        definition = obj(obj(templates[str(binding.templateId)]).definition);
      if (
        t.name !== definition.name ||
        obj(t.language).code !== definition.language ||
        !Array.isArray(definition.components) ||
        t.components !== undefined
      )
        fail();
      const parts = definition.components as ObjectValue[];
      if (parts.some((c) => !['HEADER', 'BODY', 'FOOTER', 'BUTTONS'].includes(c.type))) fail();
      const body = parts.find((c) => c.type === 'BODY'),
        buttons = obj(parts.find((c) => c.type === 'BUTTONS')).buttons;
      if (
        !Array.isArray(buttons) ||
        !Array.isArray(sim.buttonIds) ||
        buttons.length !== sim.buttonIds.length
      )
        fail();
      base.text = str(obj(body).text);
      interactive = {
        kind: 'buttons',
        context: sim.editorContext === 'interactive' ? 'interactive' : 'template',
        header: parts.find((c) => c.type === 'HEADER')?.text,
        footer: parts.find((c) => c.type === 'FOOTER')?.text,
        buttons: buttons.map((b: ObjectValue, i: number) => ({
          id: str(sim.buttonIds[i]),
          title: b.type === 'COPY_CODE' ? 'Copy code' : str(b.text),
          type: str(b.type).toLowerCase() as MessageButton['type'],
          ...(b.url !== undefined ? { url: b.url } : {}),
          ...(b.phone_number !== undefined ? { phoneNumber: b.phone_number } : {}),
          ...(b.example !== undefined ? { code: b.example } : {}),
          ...(b.ttl_minutes !== undefined ? { ttlMinutes: b.ttl_minutes } : {}),
        })),
      };
    } else if (m.type === 'interactive') {
      const v = obj(m.interactive),
        action = obj(v.action);
      base.text = str(obj(v.body).text);
      if (v.header !== undefined && obj(v.header).type !== 'text') fail();
      const common = { header: v.header?.text, footer: v.footer?.text };
      if (v.type === 'flow') {
        const p = obj(action.parameters),
          flow = obj(obj(flows[str(binding.flowId)]).definition);
        if (
          p.flow_message_version !== '3' ||
          action.name !== 'flow' ||
          p.flow_action !== 'navigate'
        )
          fail();
        if (auto?.type !== 'complete_flow') fail();
        const answers: Record<string, any> = {};
        for (const fields of Object.values(obj(auto!.valuesByScreen)))
          for (const [key, value] of Object.entries(obj(fields))) {
            if (key in answers && JSON.stringify(answers[key]) !== JSON.stringify(value))
              throw new Error('Different answers for repeated field names are not supported yet.');
            answers[key] = value;
          }
        return {
          ...base,
          type: 'flow',
          label: str(p.flow_cta),
          flow: flow as any,
          answers,
          completion: str(sim.completionText ?? ''),
        };
      }
      if (v.type === 'button') {
        if (!Array.isArray(action.buttons) || action.buttons.some((b: any) => b.type !== 'reply'))
          fail();
        interactive = {
          kind: 'buttons',
          buttons: action.buttons.map((b: any) => ({
            id: str(obj(b.reply).id),
            title: str(b.reply.title),
          })),
          ...common,
        };
      } else if (v.type === 'list')
        interactive = {
          kind: 'list',
          button: str(action.button),
          sections: action.sections,
          ...common,
        };
      else if (['cta_url', 'voice_call'].includes(v.type)) {
        if (action.name !== v.type) fail();
        const p = obj(action.parameters);
        interactive = {
          kind: 'buttons',
          buttons: [
            {
              id: str(sim.buttonIds?.[0]),
              title: str(p.display_text),
              type: v.type === 'cta_url' ? 'url' : 'voice_call',
              ...(v.type === 'cta_url'
                ? { url: str(p.url) }
                : p.ttl_minutes !== undefined
                  ? { ttlMinutes: p.ttl_minutes }
                  : {}),
            },
          ],
          ...common,
        };
      } else fail();
    } else fail();
    if (auto) {
      if (auto.type !== 'select_reply') fail();
      interactive.autoReplyId = str(auto.replyId);
    }
    return { ...base, interactive };
  });
  const project: Project = {
    version: 1,
    contact: { name: str(business.name), avatar, verified: business.verified },
    steps,
    document: {
      resources,
      metadata: { id: meta.id, title: meta.title, contentLocale: meta.contentLocale },
      customer,
      playback: { userPace: playback.userPace },
      ...(d.extensions ? { extensions: obj(d.extensions) } : {}),
    },
  };
  return normalizeProject(project, { allowDrafts: true });
}
export async function readDocument(file: File): Promise<Project> {
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error('The file exceeds the 8 MiB limit.');
  const raw = JSON.parse(await file.text());
  const project = importDocument(raw);
  for (const asset of Object.values(project.document?.resources?.assets ?? {}) as ObjectValue[]) {
    if (asset.type === 'builtin') {
      if (asset.name !== 'luma-home' || asset.source !== DEFAULT_AVATAR) fail();
      continue;
    }
    if (
      asset.encoding !== 'base64' ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)
    )
      fail();
    const safe = await sanitizeAvatar('data:' + asset.mimeType + ';base64,' + str(asset.data));
    const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(safe);
    if (!match) fail();
    asset.mimeType = match![1];
    asset.data = match![2];
  }
  return prepareProjectImages(project);
}
export async function downloadDocument(project: Project) {
  const safe = await prepareProjectImages(project);
  const json = JSON.stringify(exportDocument(safe), null, 2);
  if (new TextEncoder().encode(json).length > MAX_DOCUMENT_BYTES)
    throw new Error('The file exceeds the 8 MiB limit.');
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download =
    (project.contact.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'experience') +
    '.whatsdemo.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
