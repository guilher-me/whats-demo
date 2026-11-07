import { t } from '../i18n';
import type { Attachment, AttachmentKind, MediaStep, Project, Step } from './types';

export const MAX_ATTACHMENTS = 50;
export const MAX_ATTACHMENT_NAME = 120;
export const MAX_DOCUMENT_SIZE_LABEL = 24;
export const MAX_CAPTION = 1024;

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function label(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    !!value.trim() &&
    value.length <= max &&
    !/[\x00-\x1f\x7f]/.test(value)
  );
}

export function validateAttachments(value: unknown): Attachment[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS)
    throw new Error(t('attachments.limit', { count: MAX_ATTACHMENTS }));

  const ids = new Set<string>();
  for (const item of value) {
    if (
      !object(item) ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
      ['constructor', 'prototype', '__proto__'].includes(item.id) ||
      ids.has(item.id) ||
      !label(item.name, MAX_ATTACHMENT_NAME)
    )
      throw new Error(t('attachments.invalid'));

    const fields = ['id', 'name', 'kind'];
    if (item.kind === 'document' && label(item.sizeLabel, MAX_DOCUMENT_SIZE_LABEL))
      fields.push('sizeLabel');
    else if (item.kind !== 'image') throw new Error(t('attachments.invalid'));
    if (Object.keys(item).some((key) => !fields.includes(key)))
      throw new Error(t('attachments.invalid'));
    ids.add(item.id);
  }
  return value;
}

export function stepAttachment(step: Step, attachments: readonly Attachment[]) {
  if (step.type === 'flow' || !step.media) return undefined;
  const { kind, attachmentId } = step.media;
  return attachments.find((item) => item.id === attachmentId && item.kind === kind);
}

export function conversationAttachments(project: Project, kind?: AttachmentKind): Attachment[] {
  const items = new Map(project.attachments?.map((item) => [item.id, item]));
  const used = new Map<string, Attachment>();
  for (const step of project.steps) {
    if (step.type === 'flow' || !step.media || (kind && step.media.kind !== kind)) continue;
    for (const id of [step.media.attachmentId, ...(step.media.alternativeIds ?? [])]) {
      if (!id) continue;
      const item = items.get(id);
      if (item?.kind === step.media.kind) used.set(id, item);
    }
  }
  return [...used.values()];
}

export function pruneAttachments(project: Project): Project {
  const items = conversationAttachments(project);
  return { ...project, attachments: items.length ? items : undefined };
}

export function nextImageName(attachments: Attachment[]) {
  const names = new Set(
    attachments.filter((item) => item.kind === 'image').map((item) => item.name),
  );
  for (let number = 1; ; number++) {
    const name = 'IMG ' + String(number).padStart(2, '0');
    if (!names.has(name)) return name;
  }
}

export function selectAttachment(media: MediaStep, id: string, alternative: boolean): MediaStep {
  const alternatives = media.alternativeIds ?? [];
  if (alternative && media.attachmentId) return { ...media, alternativeIds: [...alternatives, id] };
  const remaining = alternatives.filter((item) => item !== id);
  return { ...media, attachmentId: id, alternativeIds: remaining.length ? remaining : undefined };
}

export function validateMediaSteps(project: Project, allowDrafts = false) {
  const attachments = validateAttachments(project.attachments);
  for (const step of project.steps) {
    const media = (step as { media?: unknown }).media;
    if (media === undefined) continue;
    if (
      step.type === 'flow' ||
      !object(media) ||
      !['image', 'document'].includes(String(media.kind)) ||
      Object.keys(media).some(
        (key) => !['kind', 'attachmentId', 'alternativeIds', 'caption'].includes(key),
      ) ||
      step.interactive !== undefined ||
      step.voiceDurationSeconds !== undefined ||
      (media.caption !== undefined &&
        (media.kind !== 'image' ||
          typeof media.caption !== 'string' ||
          media.caption.length > MAX_CAPTION))
    )
      throw new Error(t('attachments.invalid'));
    if ((!allowDrafts || media.attachmentId !== undefined) && !stepAttachment(step, attachments))
      throw new Error(t('attachments.required'));
    if (
      media.alternativeIds !== undefined &&
      (step.type !== 'user' ||
        !Array.isArray(media.alternativeIds) ||
        media.alternativeIds.length > MAX_ATTACHMENTS ||
        new Set(media.alternativeIds).size !== media.alternativeIds.length ||
        media.alternativeIds.some(
          (id) =>
            id === media.attachmentId ||
            !attachments.some((item) => item.id === id && item.kind === media.kind),
        ))
    )
      throw new Error(t('attachments.invalid'));
  }
}
