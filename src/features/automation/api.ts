import { t } from '../../i18n';
import { clone, normalizeProject } from '../../core/project';
import { createURL } from '../../core/codec';
import type { ChatMessage, Project } from '../../core/types';

export interface AutomationState {
  ready: boolean;
  running: boolean;
  status: string;
  activeStep: string | null;
  flowScreen: string | null;
  pendingMessageId: string | null;
  messages: ChatMessage[];
}
export interface AutomationBindings {
  project: () => Project;
  state: () => AutomationState;
  hasErrors: () => boolean;
  replace: (project: Project) => void;
  run: (project: Project, automatic: boolean) => Promise<void>;
  stop: () => void;
  reset: () => void;
  example: () => Project;
  instructions: () => string;
  href: () => string;
}
export type ValidationResult =
  { valid: true; project: Project } | { valid: false; errors: string[] };

/** Versioned public contract; never exposes mutable application state or executes supplied code. */
export function createAutomationAPI(bindings: AutomationBindings) {
  const requireReady = () => {
    if (!bindings.state().ready) throw new Error(t('errors.loading'));
  };
  return Object.freeze({
    apiVersion: 1 as const,
    projectVersion: 1 as const,
    getInstructions: () => bindings.instructions(),
    getProject: () => clone(bindings.project()),
    getExample: () => clone(bindings.example()),
    getState: () => clone(bindings.state()),
    validateProject(input: unknown): ValidationResult {
      try {
        return { valid: true, project: normalizeProject(input) };
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
    async createShareURL(input?: unknown): Promise<string> {
      if (input === undefined) requireReady();
      return createURL(
        normalizeProject(input === undefined ? bindings.project() : input),
        bindings.href(),
      );
    },
    async play(mode: 'automatic' | 'manual' = 'automatic'): Promise<AutomationState> {
      requireReady();
      if (mode !== 'automatic' && mode !== 'manual') throw new Error(t('errors.mode'));
      if (bindings.state().running) throw new Error(t('errors.running'));
      if (bindings.hasErrors()) throw new Error(t('errors.pendingFields'));
      const project = normalizeProject(bindings.project());
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
    whatsappFakeFlows?: AutomationAPI;
  }
}
