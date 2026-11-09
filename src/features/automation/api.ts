import { t } from '../../i18n';
import { clone, normalizeProject } from '../../core/project';
import { createShareURL, type ShareMode } from '../../core/codec';
import { reviewJourney, type JourneyDiagnostic } from '../flows/diagnostics';
import type { ChatMessage, LocationPlace, Project } from '../../core/types';

export interface AutomationState {
  ready: boolean;
  running: boolean;
  status: string;
  activeStep: string | null;
  flowScreen: string | null;
  pendingMessageId: string | null;
  messages: (Omit<ChatMessage, 'attachment'> & {
    attachmentId?: string;
    location?: LocationPlace;
  })[];
}
export interface AutomationBindings {
  project: () => Project;
  state: () => AutomationState;
  hasErrors: () => boolean;
  replace: (project: Project) => void;
  run: (project: Project, automatic: boolean) => Promise<void>;
  stop: () => void;
  reset: () => void;
  instructions: () => string;
  href: () => string;
}
export type ValidationResult =
  | { valid: true; project: Project; diagnostics: JourneyDiagnostic[] }
  | { valid: false; errors: string[]; diagnostics?: JourneyDiagnostic[] };

/** Versioned public contract; never exposes mutable application state or executes supplied code. */
export function createAutomationAPI(bindings: AutomationBindings) {
  const requireReady = () => {
    if (!bindings.state().ready) throw new Error(t('errors.loading'));
  };
  return Object.freeze({
    apiVersion: 4 as const,
    projectVersion: 1 as const,
    getInstructions: () => bindings.instructions(),
    getProject: () => clone(bindings.project()),
    getState: () => clone(bindings.state()),
    validateProject(input: unknown): ValidationResult {
      try {
        const { project, diagnostics, errors } = reviewJourney(input);
        return errors.length
          ? { valid: false, errors, diagnostics }
          : { valid: true, project, diagnostics };
      } catch (error) {
        return { valid: false, errors: [(error as Error).message] };
      }
    },
    loadProject(input: unknown): Project {
      requireReady();
      const project = normalizeProject(input);
      bindings.replace(project);
      return clone(project);
    },
    createShareURL(input: unknown = bindings.project(), mode: ShareMode = 'editor') {
      return createShareURL(input, mode, bindings.href());
    },
    async play(mode: 'automatic' | 'manual' = 'automatic'): Promise<AutomationState> {
      requireReady();
      if (mode !== 'automatic' && mode !== 'manual') throw new Error(t('errors.mode'));
      if (bindings.state().running) throw new Error(t('errors.running'));
      if (bindings.hasErrors()) throw new Error(t('errors.pendingFields'));
      const project = normalizeProject(bindings.project());
      if (!project.steps.length) throw new Error(t('playback.addStep'));
      await bindings.run(project, mode === 'automatic');
      return clone(bindings.state());
    },
    stop: () => bindings.stop(),
    reset: () => bindings.reset(),
  });
}
export type AutomationAPI = ReturnType<typeof createAutomationAPI>;
declare global {
  interface Window {
    whatsDemo?: AutomationAPI;
  }
}
