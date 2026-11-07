import { t } from '../../i18n';
import { validateAttachments } from '../attachments';
import type { Attachment, Project } from '../types';
import { sanitizeImage } from './sanitize';

export async function prepareAttachments(project: Project): Promise<Project> {
  if (!project.attachments?.length) return project;
  const attachments: Attachment[] = [];
  for (const item of validateAttachments(project.attachments)) {
    try {
      if (item.kind === 'image')
        attachments.push({ ...item, source: await sanitizeImage(item.source) });
      else
        attachments.push(item.cover ? { ...item, cover: await sanitizeImage(item.cover) } : item);
    } catch {
      throw new Error(t('attachments.invalidImage', { v0: item.name }));
    }
  }
  validateAttachments(attachments);
  return { ...project, attachments };
}
