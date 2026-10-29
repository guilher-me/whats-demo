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
// The renderer uses per-render shared caches; serialize snapshots even after cancellation.
let pending: Promise<unknown> = Promise.resolve();

/** Rasterize only the phone. Current input values, CSS state and scroll offsets are preserved. */
export function capturePhone(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const frame = pending.then(() =>
    domToImage.toCanvas(node, {
      width,
      height,
      pixelRatio: 2,
      bgcolor: '#ffffff',
      preserveScroll: true,
      disableEmbedFonts: true,
      styleCaching: 'strict',
      style: { margin: '0', boxShadow: 'none' },
      filter: (child) =>
        !(child instanceof Element && child.hasAttribute('data-recording-exclude')),
      adjustClonedNode: copyLiveField,
      onclone: restoreTextAreas,
    }),
  );
  pending = frame.catch(() => {});
  return frame;
}
