import { useRef } from 'preact/hooks';

interface Props {
  background: string;
  /** Changing this crossfades from the previous background instead of cutting. */
  fadeKey: string;
  label: string;
  onSwipe: (direction: 1 | -1) => void;
}

const SWIPE_MIN = 48;

export function Hero({ background, fadeKey, label, onSwipe }: Props) {
  const last = useRef({ key: fadeKey, background });
  const ghost = useRef<{ background: string; n: number } | null>(null);

  // Gradients can't be transitioned in CSS, so keep the outgoing one on top
  // and fade it away when the bird changes.
  if (last.current.key !== fadeKey) {
    ghost.current = { background: last.current.background, n: (ghost.current?.n ?? 0) + 1 };
  }
  last.current = { key: fadeKey, background };

  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
  };

  return (
    <div
      class="hero"
      role="img"
      aria-label={label}
      style={{ backgroundImage: background }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      {ghost.current && (
        <div key={ghost.current.n} class="hero__ghost" style={{ backgroundImage: ghost.current.background }} />
      )}
    </div>
  );
}
