import { expect, it } from 'vitest';
import {
  approachPoint,
  attentionPoints,
  motionRandom,
  safeClickPoint,
} from '../src/features/playback/humanMotion';
const lines = Array.from({ length: 20 }, (_, i) => ({
  left: 10,
  right: 180,
  top: i * 20,
  bottom: i * 20 + 16,
}));
it('limits observation to at most two attention points, even for long text', () => {
  for (let seed = 1; seed < 80; seed++) {
    const points = attentionPoints(lines, 'word '.repeat(100), motionRandom(seed));
    expect(points.length).toBeGreaterThanOrEqual(1);
    expect(points.length).toBeLessThanOrEqual(2);
    for (const point of points) {
      expect(point.x).toBeGreaterThan(10);
      expect(point.x).toBeLessThan(180);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(400);
    }
  }
});
it('allows short messages to be read while the mouse remains still', () => {
  expect(attentionPoints(lines, 'Hello there', () => 0.2)).toEqual([]);
});
it('keeps varied clicks safely inside tiny and wide targets and repeats the same run', () => {
  const sample = () => {
    const random = motionRandom();
    return [18, 40, 180].flatMap((width) =>
      Array.from({ length: 10 }, () => {
        const rect = { left: 10, top: 20, width, height: 18 } as DOMRect;
        const point = safeClickPoint(rect, random);
        expect(point.x).toBeGreaterThan(10);
        expect(point.x).toBeLessThan(10 + width);
        expect(point.y).toBeGreaterThan(20);
        expect(point.y).toBeLessThan(38);
        return point;
      }),
    );
  };
  const points = sample();
  expect(points).toEqual(sample());
  expect(new Set(points.map((point) => point.x)).size).toBeGreaterThan(10);
});
it('uses a small bend rather than a straight midpoint for an approach', () => {
  const via = approachPoint({ x: 0, y: 0 }, { x: 100, y: 0 }, () => 0.8);
  expect(via.x).toBeGreaterThan(0);
  expect(via.x).toBeLessThan(100);
  expect(via.y).toBeGreaterThan(0);
  expect(via.y).toBeLessThan(15);
});
