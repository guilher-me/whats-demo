import { normalizeProject } from './project';

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Old drafts and links can contain image bytes. Keep their labels and references only. */
export function recoverProject(input: unknown, allowDrafts = false) {
  if (!record(input) || !Array.isArray(input.attachments))
    return normalizeProject(input, { allowDrafts });
  const attachments = input.attachments.map((item: unknown) => {
    if (!record(item)) return item;
    const { id, name, kind, sizeLabel, source, cover, customerVisible } = item;
    if (source === undefined && cover === undefined && customerVisible === undefined) return item;
    return kind === 'document' ? { id, name, kind, sizeLabel } : { id, name, kind };
  });
  return normalizeProject({ ...input, attachments }, { allowDrafts });
}
