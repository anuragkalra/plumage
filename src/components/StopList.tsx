import { useEffect, useRef, useState } from 'preact/hooks';
import { CloseIcon, GripIcon } from './icons';

export interface EditableStop {
  id: string;
  part: string;
  hex: string;
}

interface Props {
  stops: EditableStop[];
  copiedKey: string | null;
  onChange: (stops: EditableStop[]) => void;
  onCopyHex: (stop: EditableStop) => void;
}

const MIN_STOPS = 2;

function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function StopList({ stops, copiedKey, onChange, onCopyHex }: Props) {
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  const refocus = useRef<string | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  // Keyed reordering can move the focused node; put focus back on its handle.
  useEffect(() => {
    if (!refocus.current) return;
    document.querySelector<HTMLElement>(`[data-handle="${refocus.current}"]`)?.focus();
    refocus.current = null;
  });

  useEffect(() => () => cleanup.current?.(), []);

  const commit = (next: EditableStop[]) => {
    stopsRef.current = next;
    onChange(next);
  };

  const onPointerDown = (e: PointerEvent, id: string) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const row = (e.currentTarget as HTMLElement).closest('li');
    if (!row) return;
    const rowHeight = row.getBoundingClientRect().height;
    let originY = e.clientY;

    // Window listeners rather than pointer capture: the row's DOM node gets
    // moved as the list reorders, which would drop capture.
    const onMove = (ev: PointerEvent) => {
      const list = stopsRef.current;
      const i = list.findIndex((s) => s.id === id);
      let dy = ev.clientY - originY;
      if (dy > rowHeight / 2 && i < list.length - 1) {
        commit(move(list, i, i + 1));
        originY += rowHeight;
        dy -= rowHeight;
      } else if (dy < -rowHeight / 2 && i > 0) {
        commit(move(list, i, i - 1));
        originY -= rowHeight;
        dy += rowHeight;
      }
      // Don't let the lifted row travel far past either end of the list.
      const j = stopsRef.current.findIndex((s) => s.id === id);
      const limit = rowHeight / 2;
      if (j === 0) dy = Math.max(dy, -limit);
      if (j === list.length - 1) dy = Math.min(dy, limit);
      setDrag({ id, offset: dy });
    };
    const end = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      cleanup.current = null;
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    cleanup.current = end;
    setDrag({ id, offset: 0 });
  };

  const onHandleKey = (e: KeyboardEvent, index: number, id: string) => {
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null;
    if (to === null) return;
    e.preventDefault();
    if (to < 0 || to >= stops.length) return;
    refocus.current = id;
    commit(move(stops, index, to));
  };

  const canRemove = stops.length > MIN_STOPS;

  return (
    <ol class={`stops${drag ? ' is-dragging' : ''}`}>
      {stops.map((stop, i) => {
        const dragging = drag?.id === stop.id;
        const copied = copiedKey === `hex:${stop.id}`;
        return (
          <li
            key={stop.id}
            class={`stop${dragging ? ' is-lifted' : ''}`}
            style={dragging ? { transform: `translate3d(0, ${drag.offset}px, 0)` } : undefined}
          >
            <button
              type="button"
              class="stop__handle"
              data-handle={stop.id}
              aria-label={`Reorder ${stop.part}, position ${i + 1} of ${stops.length}. Use arrow keys.`}
              onPointerDown={(e) => onPointerDown(e, stop.id)}
              onKeyDown={(e) => onHandleKey(e, i, stop.id)}
            >
              <GripIcon />
            </button>
            <span class="stop__swatch" style={{ backgroundColor: stop.hex }} aria-hidden="true" />
            <span class="stop__part">{stop.part}</span>
            <button
              type="button"
              class="stop__hex"
              onClick={() => onCopyHex(stop)}
              aria-label={`Copy ${stop.hex}`}
            >
              {copied ? 'Copied' : stop.hex}
            </button>
            <button
              type="button"
              class="stop__remove"
              disabled={!canRemove}
              onClick={() => commit(stops.filter((s) => s.id !== stop.id))}
              aria-label={`Remove ${stop.part}`}
              title={canRemove ? `Remove ${stop.part}` : 'A gradient needs at least two stops'}
            >
              <CloseIcon />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
