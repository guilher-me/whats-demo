import domToImage from 'dom-to-image-more';

export function copyLiveField(node: Node, clone: Node, after: boolean): void {
  if (!after || !(clone instanceof Element)) return;
  if (node instanceof HTMLInputElement && ['checkbox', 'radio'].includes(node.type))
    clone.toggleAttribute('checked', node.checked);
  if (node instanceof HTMLOptionElement) clone.toggleAttribute('selected', node.selected);
  if (node instanceof HTMLTextAreaElement) clone.setAttribute('data-captured-text', node.value);
}
export function restoreTextAreas(clone: Node): void {
  if (!(clone instanceof Element)) return;
  clone.querySelectorAll('textarea[data-captured-text]').forEach((field) => {
    field.textContent = field.getAttribute('data-captured-text');
    field.removeAttribute('data-captured-text');
  });
}
// Preserve the chat's scroll offsets while leaving offscreen bubbles out of the rasterizer.
function visibleChat(node: HTMLElement) {
  const messages = node.querySelector<HTMLElement>('.chat-body > .messages');
  if (!messages?.parentElement || !messages.childElementCount) return;
  const viewport = messages.parentElement.getBoundingClientRect();
  const children = Array.from(messages.children) as HTMLElement[];
  const visible = children.filter((child) => {
    const bounds = child.getBoundingClientRect();
    return bounds.bottom >= viewport.top - 24 && bounds.top <= viewport.bottom + 24;
  });
  if (!visible.length || visible.length === children.length) return;
  const first = visible[0];
  const last = visible[visible.length - 1];
  const before = first.offsetTop - children[0].offsetTop;
  const tail = children[children.length - 1];
  const after = tail.offsetTop + tail.offsetHeight - last.offsetTop - last.offsetHeight;
  return { children: new Set<Node>(children), visible: new Set<Node>(visible), before, after };
}

// The renderer uses per-render shared caches; serialize snapshots even after cancellation.
let pending: Promise<unknown> = Promise.resolve();

/** Rasterize only the phone. Current input values, CSS state and scroll offsets are preserved. */
export function capturePhone(
  node: HTMLElement,
  width: number,
  height: number,
  backdrop: string,
): Promise<HTMLCanvasElement> {
  const frame = pending.then(() => {
    const chat = visibleChat(node);
    return domToImage.toCanvas(node, {
      width,
      height,
      pixelRatio: 2,
      bgcolor: backdrop,
      preserveScroll: true,
      disableEmbedFonts: true,
      styleCaching: 'strict',
      style: { margin: '0', filter: 'none' },
      filter: (child) =>
        !(child instanceof Element && child.hasAttribute('data-recording-exclude')) &&
        !(chat?.children.has(child) && !chat.visible.has(child)),
      adjustClonedNode: copyLiveField,
      onclone: (clone) => {
        restoreTextAreas(clone);
        const messages =
          chat && clone instanceof Element
            ? clone.querySelector<HTMLElement>('.chat-body > .messages')
            : null;
        if (messages && chat) {
          messages.style.paddingBlockStart = chat.before + 'px';
          messages.style.paddingBlockEnd = chat.after + 'px';
        }
      },
    });
  });
  pending = frame.catch(() => {});
  return frame;
}
