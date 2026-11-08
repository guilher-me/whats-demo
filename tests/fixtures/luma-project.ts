import data from './luma-project.json';
import type { Project } from '../../src/core/types';
import { clone } from '../../src/core/project';

export function createLumaProject(): Project {
  return clone(data) as Project;
}
