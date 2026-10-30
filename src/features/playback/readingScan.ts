export interface ReadingLine {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Use rendered text fragments so wrapping and inline formatting follow the real layout. */
export function readingLines(element: HTMLElement, phone: HTMLElement): ReadingLine[] {
  let clip = phone.getBoundingClientRect();
  let left = clip.left,
    right = clip.right,
    top = clip.top,
    bottom = clip.bottom;
  for (
    let parent: HTMLElement | null = element;
    parent && parent !== phone;
    parent = parent.parentElement
  ) {
    const style = getComputedStyle(parent);
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
      clip = parent.getBoundingClientRect();
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
    }
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
      clip = parent.getBoundingClientRect();
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
    }
  }
  const lines: ReadingLine[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (
      !node.textContent?.trim() ||
      !parent ||
      parent.closest('time,svg,script,style,select,textarea,[aria-hidden="true"],.visually-hidden')
    )
      continue;
    const style = getComputedStyle(parent);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    if (typeof range.getClientRects !== 'function') continue;
    for (const rect of Array.from(range.getClientRects())) {
      const y = (rect.top + rect.bottom) / 2;
      if (
        !rect.width ||
        !rect.height ||
        y < top ||
        y > bottom ||
        rect.right <= left ||
        rect.left >= right
      )
        continue;
      const fragment = {
        left: Math.max(left, rect.left),
        right: Math.min(right, rect.right),
        top: rect.top,
        bottom: rect.bottom,
      };
      const line = lines.find((line) => Math.abs((line.top + line.bottom) / 2 - y) < 4);
      if (line) {
        line.left = Math.min(line.left, fragment.left);
        line.right = Math.max(line.right, fragment.right);
      } else lines.push(fragment);
    }
  }
  return lines.sort((a, b) => a.top - b.top || a.left - b.left);
}
