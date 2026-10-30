/** A short, bounded reading pause at the normal simulated-user pace. */
export function readingDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(5000, Math.max(800, 400 + words * 160));
}
