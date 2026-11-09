import { useLayoutEffect, useState, type RefObject } from 'react';
import type { Step } from '../../../core/types';
import { scrollToStep } from './step-scroll';

/** Focus only an explicitly added step; ordinary edits and imported projects never move the page. */
export function useAddedStepFocus(steps: Step[], scrollRef: RefObject<HTMLDivElement | null>) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (!pendingId || !scrollRef.current) return;
    scrollToStep(scrollRef.current, pendingId, true);
    setPendingId(null);
  }, [pendingId, steps, scrollRef]);
  return setPendingId;
}
