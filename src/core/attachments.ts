import { t } from '../i18n';
import type { Attachment, AttachmentKind, Project, Step } from './types';
import { IMAGE_LIMITS } from './images/policy';

export const MAX_ATTACHMENTS = 50;
export const MAX_ATTACHMENT_NAME = 120;
export const MAX_DOCUMENT_SIZE_LABEL = 24;
export const MAX_CAPTION = 1024;
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

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

function imageSource(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 4 * Math.ceil(IMAGE_LIMITS.bytes / 3) + 32 &&
    /^data:image\/(png|jpeg|webp);base64,/.test(value)
  );
}

export function validateAttachments(value: unknown): Attachment[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS)
    throw new Error(t('attachments.limit', { count: MAX_ATTACHMENTS }));

  const ids = new Set<string>();
  let encodedBytes = 0;
  for (const item of value) {
    if (
      !object(item) ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
      ['constructor', 'prototype', '__proto__'].includes(item.id) ||
      ids.has(item.id) ||
      !label(item.name, MAX_ATTACHMENT_NAME) ||
      typeof item.customerVisible !== 'boolean'
    )
      throw new Error(t('attachments.invalid'));
    const base = ['id', 'name', 'customerVisible', 'kind'];
    if (
      item.kind === 'image' &&
      imageSource(item.source) &&
      Object.keys(item).every((key) => [...base, 'source'].includes(key))
    ) {
      encodedBytes += item.source.length;
    } else if (
      item.kind === 'document' &&
      label(item.sizeLabel, MAX_DOCUMENT_SIZE_LABEL) &&
      (item.cover === undefined || imageSource(item.cover)) &&
      Object.keys(item).every((key) => [...base, 'sizeLabel', 'cover'].includes(key))
    ) {
      encodedBytes += item.cover?.length ?? 0;
    } else {
      throw new Error(t('attachments.invalid'));
    }
    ids.add(item.id);
  }
  if (encodedBytes > MAX_DOCUMENT_BYTES) throw new Error(t('attachments.tooLarge'));
  return value;
}

export function availableAttachments(
  attachments: readonly Attachment[],
  kind: AttachmentKind,
  customer: boolean,
) {
  return attachments.filter((item) => item.kind === kind && (!customer || item.customerVisible));
}

export function stepAttachment(step: Step, attachments: readonly Attachment[]) {
  if (step.type === 'flow' || !step.media) return undefined;
  return availableAttachments(attachments, step.media.kind, step.type === 'user').find(
    (item) => item.id === step.media?.attachmentId,
  );
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
      Object.keys(media).some((key) => !['kind', 'attachmentId', 'caption'].includes(key)) ||
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
  }
}
