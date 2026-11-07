import data from './default-project.json';
import type { Project } from './types';
import { clone } from './project';

export function createDefaultProject(): Project {
  return clone(data) as Project;
}
