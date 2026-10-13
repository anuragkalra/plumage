export type GradientType = 'linear' | 'radial' | 'conic';

export const GRADIENT_TYPES: GradientType[] = ['linear', 'radial', 'conic'];

export interface GradientSpec {
  type: GradientType;
  /** Degrees. Direction for linear, start angle for conic, unused for radial. */
  angle: number;
  colors: string[];
}

export function usesAngle(type: GradientType): boolean {
  return type !== 'radial';
}

/** The CSS <image> value, e.g. `linear-gradient(180deg, #000, #fff)`. */
export function gradientValue({ type, angle, colors }: GradientSpec): string {
  const list = colors.join(', ');
  switch (type) {
    case 'linear':
      return `linear-gradient(${angle}deg, ${list})`;
    case 'radial':
      return `radial-gradient(${list})`;
    case 'conic':
      return angle === 0 ? `conic-gradient(${list})` : `conic-gradient(from ${angle}deg, ${list})`;
  }
}

export function cssDeclaration(spec: GradientSpec): string {
  return `background: ${gradientValue(spec)};`;
}

/**
 * Paint the gradient onto a canvas using the same geometry CSS uses, so the
 * exported PNG matches the live preview.
 */
function paint(ctx: CanvasRenderingContext2D, w: number, h: number, spec: GradientSpec) {
  const { type, angle, colors } = spec;
  const last = Math.max(colors.length - 1, 1);
  const addStops = (g: CanvasGradient) => colors.forEach((c, i) => g.addColorStop(i / last, c));
  const cx = w / 2;
  const cy = h / 2;

  if (type === 'linear') {
    // CSS: 0deg points up, 90deg points right. Line length spans the box corners.
    const rad = (angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
    addStops(g);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (type === 'radial') {
    // CSS default: ellipse, farthest-corner, centered.
    const rx = (w / 2) * Math.SQRT2;
    const ry = (h / 2) * Math.SQRT2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    addStops(g);
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
    return;
  }

  // Conic: CSS 0deg is up; canvas 0rad is to the right. Both run clockwise.
  const g = ctx.createConicGradient(((angle - 90) * Math.PI) / 180, cx, cy);
  addStops(g);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Add ±1 of triangular noise per channel so large exports don't band. */
function dither(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random() - Math.random();
    d[i] = d[i]! + n;
    d[i + 1] = d[i + 1]! + n;
    d[i + 2] = d[i + 2]! + n;
  }
  ctx.putImageData(image, 0, 0);
}

export function renderPng(spec: GradientSpec, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas 2D is unavailable'));
  paint(ctx, width, height, spec);
  dither(ctx, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png');
  });
}
