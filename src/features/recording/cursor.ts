/** Sample the interpolated CSS position, including the press scale and fade. */
export function readRecordingCursor(root: HTMLElement, cursor: HTMLElement | null) {
  if (!cursor) return null;
  const style = getComputedStyle(cursor);
  const opacity = Number(style.opacity);
  if (!opacity || style.visibility === 'hidden') return null;
  const rootBounds = root.getBoundingClientRect();
  const bounds = cursor.getBoundingClientRect();
  if (!rootBounds.width || !rootBounds.height || !bounds.width || !cursor.offsetWidth) return null;
  const scale = bounds.width / cursor.offsetWidth;
  return {
    x: bounds.left - rootBounds.left + bounds.width / 2,
    y: bounds.top - rootBounds.top + bounds.height / 2,
    width: rootBounds.width,
    height: rootBounds.height,
    radius: bounds.width / 2,
    opacity,
    border: parseFloat(style.borderTopWidth) * scale,
    halo: parseFloat(style.getPropertyValue('--cursor-halo-size')) * scale,
    haloColor: style.getPropertyValue('--cursor-halo-color').trim(),
    fill: style.backgroundColor,
    stroke: style.borderTopColor,
  };
}

type CursorFrame = NonNullable<ReturnType<typeof readRecordingCursor>>;

export function paintRecordingCursor(context: CanvasRenderingContext2D, cursor: CursorFrame) {
  const { x, y, width, height, radius, opacity, border, halo, haloColor, fill, stroke } = cursor;
  const circle = (r: number) => {
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, 2 * Math.PI);
  };
  context.save();
  context.scale(context.canvas.width / width, context.canvas.height / height);
  context.translate(x, y);
  context.globalAlpha = opacity;

  context.fillStyle = haloColor;
  context.beginPath();
  circle(radius + halo);
  circle(radius);
  context.fill('evenodd');

  context.fillStyle = fill;
  context.beginPath();
  circle(radius - border);
  context.fill();

  context.lineWidth = border;
  context.strokeStyle = stroke;
  context.beginPath();
  circle(radius - border / 2);
  context.stroke();
  context.restore();
}
