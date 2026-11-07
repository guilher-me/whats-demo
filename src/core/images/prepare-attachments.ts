import { t } from '../../i18n';
import { validateAttachments } from '../attachments';
import type { Attachment, Project } from '../types';
import { sanitizeAttachmentImage } from './sanitize';

export async function prepareAttachments(project: Project): Promise<Project> {
  if (!project.attachments?.length) return project;
  const attachments: Attachment[] = [];
  for (const item of validateAttachments(project.attachments)) {
    try {
      if (item.kind === 'image')
        attachments.push({ ...item, source: await sanitizeAttachmentImage(item.source) });
      else
        attachments.push(
          item.cover ? { ...item, cover: await sanitizeAttachmentImage(item.cover) } : item,
        );
    } catch {
      throw new Error(t('attachments.invalidImage', { v0: item.name }));
    }
  }
  validateAttachments(attachments);
  return { ...project, attachments };
}
