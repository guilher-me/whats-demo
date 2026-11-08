import { useEffect, useRef } from 'react';

const MAX_FLAKES = 80;
const FRAME_INTERVAL = 1000 / 30;

export function Snowfall() {
  const surface = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = surface.current!;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const flakes = Array.from({ length: MAX_FLAKES }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: 1 + Math.random() * 2.3,
      speed: 22 + Math.random() * 43,
      drift: Math.random() * Math.PI * 2,
      opacity: 0.4 + Math.random() * 0.46,
    }));
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastPaint = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!height || time - lastPaint < FRAME_INTERVAL) return;
      const seconds = lastPaint ? Math.min((time - lastPaint) / 1000, 0.1) : 0;
      lastPaint = time;

      context.clearRect(0, 0, width, height);
      const dark = document.documentElement.dataset.theme === 'dark';
      context.fillStyle = dark ? '#eef8ff' : '#fbfdff';
      context.strokeStyle = '#587b9f';
      context.lineWidth = 0.7;
      const count = Math.min(MAX_FLAKES, Math.max(30, Math.round(width / 16)));

      for (let index = 0; index < count; index++) {
        const flake = flakes[index];
        flake.y = (flake.y + (seconds * flake.speed) / (height + 8)) % 1;
        flake.drift += seconds * 0.9;
        const x = flake.x * width + Math.sin(flake.drift) * 14;
        const y = flake.y * (height + 8) - 4;
        context.globalAlpha = flake.opacity;
        context.beginPath();
        context.arc(x, y, flake.radius, 0, Math.PI * 2);
        context.fill();
        if (!dark) context.stroke();
      }

      // Clear the frame's live bounds so the exclusion follows scrolling, resizing and recording.
      for (const phone of document.querySelectorAll('[data-seasonal-exclusion]')) {
        const rect = phone.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const left = Math.floor(rect.left);
        const top = Math.floor(rect.top);
        context.clearRect(left, top, Math.ceil(rect.right) - left, Math.ceil(rect.bottom) - top);
      }
    };

    const updateMotion = () => {
      cancelAnimationFrame(frame);
      lastPaint = 0;
      context.clearRect(0, 0, width, height);
      if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(draw);
    };

    resize();
    updateMotion();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', updateMotion);
    reducedMotion.addEventListener('change', updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', updateMotion);
      reducedMotion.removeEventListener('change', updateMotion);
    };
  }, []);

  return (
    <canvas ref={surface} className="seasonal-overlay" aria-hidden="true" data-recording-exclude />
  );
}
