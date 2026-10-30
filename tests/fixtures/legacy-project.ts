import project from './v1-project.json';
import { clone } from '../../src/core/project';
import type { Project } from '../../src/core/types';

/** Keep legacy navigation coverage independent of the current showcase. */
export function createLegacyProject(): Project {
  return clone(project) as Project;
}
