import { useLayoutEffect, useState, type RefObject } from 'react';
import type { Step } from '../../../core/types';

/** Focus only an explicitly added step; ordinary edits and imported projects never move the page. */
export function useAddedStepFocus(steps: Step[], scrollRef: RefObject<HTMLDivElement | null>) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (!pendingId || !scrollRef.current) return;
    const scroll = scrollRef.current;
    const card = [...scroll.querySelectorAll<HTMLElement>('[data-step-id]')].find(
      (node) => node.dataset.stepId === pendingId,
    );
    if (!card) {
      setPendingId(null);
      return;
    }
    const field = card.querySelector<HTMLTextAreaElement>('textarea') ?? card;
    field.focus({ preventScroll: true });
    const bounds = card.getBoundingClientRect();
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    if (scroll.scrollHeight > scroll.clientHeight) {
      const visible = scroll.getBoundingClientRect();
      if (bounds.top < visible.top || bounds.bottom > visible.bottom)
        scroll.scrollTo?.({
          top: Math.max(0, scroll.scrollTop + bounds.top - visible.top - 16),
          behavior,
        });
    } else if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
      card.scrollIntoView?.({ behavior, block: 'start', inline: 'nearest' });
    }
    setPendingId(null);
  }, [pendingId, steps, scrollRef]);
  return setPendingId;
}
