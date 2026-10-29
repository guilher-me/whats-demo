import { useCallback, useRef, useState } from 'react';
import type { FlowSession, Value } from '../../../core/types';
export function useFlowSession() {
  const current = useRef<FlowSession | null>(null);
  const [session, setState] = useState<FlowSession | null>(null);
  const set = useCallback((value: FlowSession | null) => {
    current.current = value;
    setState(value);
  }, []);
  const update = useCallback(
    (name: string, value: Value) => {
      if (current.current)
        set({ ...current.current, form: { ...current.current.form, [name]: value } });
    },
    [set],
  );
  return { session, current, set, update };
}
