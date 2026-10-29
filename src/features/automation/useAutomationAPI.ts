import { useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createAutomationAPI, type AutomationBindings } from './api';
export function useAutomationAPI(bindings: AutomationBindings) {
  const latest = useRef(bindings);
  useLayoutEffect(() => {
    latest.current = bindings;
  });
  useEffect(() => {
    const api = createAutomationAPI({
      project: () => latest.current.project(),
      state: () => latest.current.state(),
      hasErrors: () => latest.current.hasErrors(),
      replace: (project) => flushSync(() => latest.current.replace(project)),
      run: (project, automatic) => {
        let task!: Promise<void>;
        flushSync(() => {
          task = latest.current.run(project, automatic);
        });
        return task;
      },
      stop: () => flushSync(() => latest.current.stop()),
      reset: () => flushSync(() => latest.current.reset()),
      example: () => latest.current.example(),
      instructions: () => latest.current.instructions(),
      href: () => latest.current.href(),
    });
    window.whatsappFakeFlows = api;
    window.dispatchEvent(
      new CustomEvent('whatsapp-fake-flows:ready', { detail: { apiVersion: 1 } }),
    );
    return () => {
      if (window.whatsappFakeFlows === api) delete window.whatsappFakeFlows;
    };
  }, []);
}
