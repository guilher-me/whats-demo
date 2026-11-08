import { currentLocale, t } from '../i18n';
import type {
  Attachment,
  AttachmentKind,
  DocumentExtension,
  DocumentUnit,
  ImageExtension,
  MediaStep,
  Project,
  Step,
} from './types';

export const MAX_DOCUMENT_NAME = 60;
export const MAX_CAPTION = 1024;

export const IMAGE_EXTENSIONS = ['png', 'jpg'] as const satisfies readonly ImageExtension[];
export const DOCUMENT_EXTENSIONS = [
  'pdf',
  'txt',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
] as const satisfies readonly DocumentExtension[];
export const DOCUMENT_UNITS = ['KB', 'MB'] as const satisfies readonly DocumentUnit[];
export const MAX_DOCUMENT_MB = 100;
export const MAX_IMAGE_LABEL = 48;

export function createMedia(kind: AttachmentKind): MediaStep {
  return kind === 'image'
    ? { kind, file: { extension: 'png', name: '' } }
    : { kind, file: { extension: 'pdf', name: '', unit: 'KB' } };
}

export function documentSizeLimit(unit: DocumentUnit) {
  return unit === 'KB' ? MAX_DOCUMENT_MB * 1000 : MAX_DOCUMENT_MB;
}

export function isDocumentSize(size: unknown, unit: DocumentUnit): size is number {
  return (
    typeof size === 'number' && Number.isFinite(size) && size > 0 && size <= documentSizeLimit(unit)
  );
}

const documentSuffix = new RegExp('\\.(' + DOCUMENT_EXTENSIONS.join('|') + ')$', 'i');

export function documentBaseName(name: string): string {
  return name.trim().replace(documentSuffix, '').trim();
}

export function documentName(name: string, extension: DocumentExtension): string {
  const base = documentBaseName(name);
  return base ? base + '.' + extension : '';
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max && !/[\x00-\x1f\x7f]/.test(value);
}

export function stepAttachment(step: Step): Attachment | undefined {
  if (step.type === 'flow' || !step.media) return undefined;
  const media = step.media;
  const id = 'media:' + step.id;
  if (media.kind === 'image')
    return {
      id,
      kind: media.kind,
      name: media.file.name.trim() || 'IMG',
      extension: media.file.extension,
    } satisfies Attachment;

  const { name, extension, size, unit } = media.file;
  const filename = documentName(name, extension);
  if (!filename || !isDocumentSize(size, unit)) return undefined;
  return {
    id,
    kind: media.kind,
    name: filename,
    extension,
    sizeLabel: size.toLocaleString(currentLocale(), { maximumSignificantDigits: 21 }) + ' ' + unit,
  } satisfies Attachment;
}

export function conversationAttachments(project: Project): Attachment[] {
  return project.steps.flatMap((step) => {
    const item = stepAttachment(step);
    return item ? [item] : [];
  });
}

function validateFile(kind: AttachmentKind, file: unknown, allowDrafts: boolean) {
  if (!object(file) || !text(file.name, kind === 'image' ? MAX_IMAGE_LABEL : MAX_DOCUMENT_NAME))
    throw new Error(t('attachments.invalid'));

  if (kind === 'image') {
    if (
      !IMAGE_EXTENSIONS.some((extension) => extension === file.extension) ||
      Object.keys(file).some((key) => !['extension', 'name'].includes(key))
    )
      throw new Error(t('attachments.invalid'));
    return;
  }
  const unit = DOCUMENT_UNITS.find((unit) => unit === file.unit);
  if (
    !unit ||
    !DOCUMENT_EXTENSIONS.some((extension) => extension === file.extension) ||
    Object.keys(file).some((key) => !['extension', 'name', 'size', 'unit'].includes(key)) ||
    (file.size !== undefined && (typeof file.size !== 'number' || !Number.isFinite(file.size)))
  )
    throw new Error(t('attachments.invalid'));
  if (allowDrafts) return;
  if (!documentBaseName(file.name)) throw new Error(t('attachments.documentNameRequired'));
  if (!isDocumentSize(file.size, unit))
    throw new Error(t('attachments.documentSizeError', { max: MAX_DOCUMENT_MB }));
}

export function validateMediaSteps(project: Project, allowDrafts = false) {
  for (const step of project.steps) {
    const media = (step as { media?: unknown }).media;
    if (media === undefined) continue;
    if (
      step.type === 'flow' ||
      !object(media) ||
      (media.kind !== 'image' && media.kind !== 'document') ||
      Object.keys(media).some((key) => !['kind', 'caption', 'file'].includes(key)) ||
      step.interactive !== undefined ||
      step.voiceDurationSeconds !== undefined ||
      (media.caption !== undefined &&
        (media.kind !== 'image' ||
          typeof media.caption !== 'string' ||
          media.caption.length > MAX_CAPTION))
    )
      throw new Error(t('attachments.invalid'));
    validateFile(media.kind, media.file, allowDrafts);
  }
}
