import data from './default-project.json';
import logo from '../../assets/prevent-senior.png';
import type { Project } from './types';
import { clone } from './project';
export const DEFAULT_AVATAR = logo;
export const FALLBACK_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#dce8df"/><circle cx="40" cy="29" r="13" fill="#8da798"/><path d="M14 74a26 26 0 0 1 52 0" fill="#8da798"/></svg>',
  );
export function createDefaultProject(): Project {
  const project = clone(data) as Project;
  project.contact.avatar = logo;
  return project;
}
export function avatarSource(value: string) {
  return value === 'assets/prevent-senior.png' ? logo : value || FALLBACK_AVATAR;
}
