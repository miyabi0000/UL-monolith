import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'zen_whitebg_seed';
const SHIFT_INTERVAL_MS = 18000;
const SHIFT_DURATION_MS = 16000;
const MAX_CANVAS_PIXELS = 2_200_000;

const hash2 = (ix: number, iy: number, seed: number) => {
  let h = (ix * 374761393 + iy * 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

const noise2D = (x: number, y: number, seed: number) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = smooth(x - x0);
  const sy = smooth(y - y0);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);
  return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
};

const getSeed = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return parseInt(saved, 10) >>> 0;
  const seed = (Math.random() * 2 ** 32) >>> 0;
  localStorage.setItem(STORAGE_KEY, String(seed));
  return seed;
};

const drawZenTexture = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
  phase: number,
) => {
  ctx.clearRect(0, 0, width, height);

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(0.55, '#f8fafc');
  base.addColorStop(1, '#f3f4f6');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const depth = ctx.createRadialGradient(width * 0.2, height * 0.18, width * 0.1, width * 0.5, height * 0.55, width * 0.95);
  depth.addColorStop(0, 'rgba(15, 23, 42, 0.02)');
  depth.addColorStop(1, 'rgba(15, 23, 42, 0.09)');
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, width, height);

  const baseSpacing = Math.max(10, Math.round(height / 70));
  const noiseScale = 0.0039;
  const amp = Math.max(4, height * 0.0125);
  const wave = 0.008 + phase * 0.0007;
  const halfHeight = Math.max(1, height * 0.5);

  for (let y = -baseSpacing * 2; y < height + baseSpacing * 2;) {
    const halfT = Math.max(0, Math.min(1, y / halfHeight));
    // 上半分にかけて徐々に細かく（前回の逆向きを補正）
    const spacing = lerp(baseSpacing * 0.52, baseSpacing * 1.36, halfT);
    const depthT = y / Math.max(1, height);
    const alphaMain = 0.07 + depthT * 0.086;
    const alphaHighlight = 0.024 + (1 - depthT) * 0.038;
    const lineAmp = amp * lerp(1.2, 0.66, halfT);

    ctx.beginPath();
    for (let x = 0; x <= width; x += 6) {
      const n = noise2D(x * noiseScale + phase * 0.18, y * noiseScale * 0.8, seed ^ 0x9e3779b9);
      const curve = Math.sin(x * wave + phase * 3.1) * lineAmp;
      const yy = y + (n - 0.5) * lineAmp * 1.72 + curve;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = `rgba(55, 65, 81, ${alphaMain.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= width; x += 6) {
      const n = noise2D(x * noiseScale + phase * 0.2 + 11.2, y * noiseScale * 0.9 + 6.1, seed ^ 0x85ebca6b);
      const curve = Math.sin(x * (wave * 1.04) + phase * 2.5) * (lineAmp * 0.62);
      const yy = y - 1.2 + (n - 0.5) * lineAmp + curve;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${alphaHighlight.toFixed(3)})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    y += spacing;
  }

  const rockCount = 3;
  for (let i = 0; i < rockCount; i += 1) {
    const rx = width * (0.22 + i * 0.27 + (hash2(i, 31, seed) - 0.5) * 0.12);
    const ry = height * (0.22 + i * 0.24 + (hash2(i, 59, seed) - 0.5) * 0.1);
    const radius = Math.min(width, height) * (0.09 + hash2(i, 77, seed) * 0.045);
    const rings = 6;

    for (let r = 1; r <= rings; r += 1) {
      const rr = radius * r * 0.78;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.07) {
        const nx = Math.cos(a) * rr;
        const ny = Math.sin(a) * rr * (0.78 + hash2(r, i, seed ^ 0x27d4eb2d) * 0.25);
        const wobble = (noise2D(a * 1.3 + r, i + phase, seed) - 0.5) * 4.5;
        const x = rx + nx + wobble;
        const y = ry + ny + wobble * 0.4;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(31, 41, 55, ${(0.022 + r * 0.004).toFixed(3)})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  const grainCount = Math.min(110000, Math.floor((width * height) / 105));
  for (let i = 0; i < grainCount; i += 1) {
    const x = hash2(i, 101, seed ^ 0xa24baed4) * width;
    const y = hash2(i, 211, seed ^ 0x165667b1) * height;
    const halfT = Math.max(0, Math.min(1, y / halfHeight));
    const depthT = y / Math.max(1, height);
    const alpha = 0.038 + depthT * 0.082 + hash2(i, 307, seed) * 0.024;
    const size = hash2(i, 409, seed) > (0.9 + (1 - halfT) * 0.06) ? 1.6 : 1;
    ctx.fillStyle = `rgba(55, 65, 81, ${alpha.toFixed(3)})`;
    ctx.fillRect(x, y, size, size);
  }

  const microCount = Math.min(150000, Math.floor((width * height) / 66));
  for (let i = 0; i < microCount; i += 1) {
    const x = hash2(i, 503, seed ^ 0x7f4a7c15) * width;
    const y = hash2(i, 607, seed ^ 0x94d049bb) * height;
    const halfT = Math.max(0, Math.min(1, y / halfHeight));
    const alpha = 0.016 + halfT * 0.028 + hash2(i, 709, seed) * 0.014;
    ctx.fillStyle = `rgba(31, 41, 55, ${alpha.toFixed(3)})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.42, width * 0.24, width * 0.5, height * 0.55, width * 0.85);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
  vignette.addColorStop(1, 'rgba(17, 24, 39, 0.1)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
};

export default function ZenGardenBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const back = document.createElement('canvas');
    const front = document.createElement('canvas');
    const backCtx = back.getContext('2d', { alpha: true });
    const frontCtx = front.getContext('2d', { alpha: true });
    if (!backCtx || !frontCtx) return;

    let dpr = 1;
    let width = 0;
    let height = 0;
    let seed = getSeed();
    let phase = 0;

    let transitionRaf = 0;
    let transitionTimer: number | undefined;
    let transitionStart = 0;
    let transitioning = false;

    const drawToMain = (mix = 0) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.drawImage(back, 0, 0, width, height);
      if (mix > 0) {
        ctx.globalAlpha = mix;
        ctx.drawImage(front, 0, 0, width, height);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      dpr = Math.min(1.25, window.devicePixelRatio || 1);
      width = Math.floor(window.innerWidth * dpr);
      height = Math.floor(window.innerHeight * dpr);
      const pixelCount = width * height;
      if (pixelCount > MAX_CANVAS_PIXELS) {
        const scale = Math.sqrt(MAX_CANVAS_PIXELS / pixelCount);
        width = Math.max(480, Math.floor(width * scale));
        height = Math.max(320, Math.floor(height * scale));
      }

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';

      back.width = width;
      back.height = height;
      front.width = width;
      front.height = height;

      drawZenTexture(backCtx, width, height, seed, phase);
      drawToMain(0);
    };

    const animateTransition = (now: number) => {
      if (!transitioning) return;
      const t = Math.min(1, (now - transitionStart) / SHIFT_DURATION_MS);
      const eased = 1 - (1 - t) * (1 - t);
      drawToMain(eased);

      if (t >= 1) {
        backCtx.clearRect(0, 0, width, height);
        backCtx.drawImage(front, 0, 0);
        drawToMain(0);
        transitioning = false;
        transitionRaf = 0;
        return;
      }
      transitionRaf = window.requestAnimationFrame(animateTransition);
    };

    const scheduleShift = () => {
      transitionTimer = window.setInterval(() => {
        if (document.documentElement.classList.contains('dark')) return;
        seed = (seed + 0x9e3779b9) >>> 0;
        localStorage.setItem(STORAGE_KEY, String(seed));
        // 位相差を小刻みに進めて「ゆっくり動く」印象を作る
        phase += 0.06;
        drawZenTexture(frontCtx, width, height, seed, phase);
        transitioning = true;
        transitionStart = performance.now();
        if (!transitionRaf) {
          transitionRaf = window.requestAnimationFrame(animateTransition);
        }
      }, SHIFT_INTERVAL_MS);
    };

    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });

    resize();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      scheduleShift();
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (transitionTimer) window.clearInterval(transitionTimer);
      if (transitionRaf) window.cancelAnimationFrame(transitionRaf);
    };
  }, []);

  return <canvas ref={canvasRef} className="zen-garden-bg fixed inset-0 pointer-events-none z-[1]" aria-hidden="true" />;
}
