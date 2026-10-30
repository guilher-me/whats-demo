import data from './default-project.json';
import logo from '../../assets/luma-home.svg';
import type { Project } from './types';
import { clone } from './project';
export { DEFAULT_AVATAR, FALLBACK_AVATAR } from './avatarAssets';
export function createDefaultProject(): Project {
  const project = clone(data) as Project;
  project.contact.avatar = logo;
  return project;
}
