import type { ReadingLine } from './readingScan';
export interface Point {
  x: number;
  y: number;
}
/** Replaying a journey gives the same small variations. */
export function motionRandom(seed = 47) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function attentionPoints(lines: ReadingLine[], text: string, random: () => number): Point[] {
  if (!lines.length) return [];
  const words = text.trim().split(/\s+/).length;
  if (words < 12 && random() < 0.45) return [];
  const count = words > 30 && lines.length > 2 && random() < 0.3 ? 2 : 1;
  return Array.from({ length: count }, (_, index) => {
    const line =
      lines[
        Math.min(lines.length - 1, Math.floor(((index + random() * 0.65) / count) * lines.length))
      ];
    return {
      x: line.left + (line.right - line.left) * (0.2 + random() * 0.45),
      y: (line.top + line.bottom) / 2 + (random() - 0.5) * Math.min(4, line.bottom - line.top),
    };
  });
}
export function safeClickPoint(rect: DOMRect, random: () => number): Point {
  return {
    x: rect.left + rect.width / 2 + (random() - 0.5) * Math.min(12, rect.width * 0.3),
    y: rect.top + rect.height / 2 + (random() - 0.5) * Math.min(8, rect.height * 0.3),
  };
}
export function approachPoint(from: Point, to: Point, random: () => number): Point {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const bend = (random() - 0.5) * Math.min(22, distance * 0.2);
  return {
    x: from.x + dx * 0.62 - (dy / distance) * bend,
    y: from.y + dy * 0.62 + (dx / distance) * bend,
  };
}
