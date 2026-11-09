export function scrollToStep(scroll: HTMLDivElement, id: string, focus = false) {
  const card = [...scroll.querySelectorAll<HTMLElement>('[data-step-id]')].find(
    (node) => node.dataset.stepId === id,
  );
  if (!card) return;

  if (focus) {
    const field = card.querySelector<HTMLTextAreaElement>('textarea') ?? card;
    field.focus({ preventScroll: true });
  }
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
  } else if (focus && (bounds.top < 0 || bounds.bottom > window.innerHeight)) {
    card.scrollIntoView?.({ behavior, block: 'start', inline: 'nearest' });
  }
}
