import { useEffect, useRef } from 'preact/hooks';
import type { Bird } from '../birds';
import { gradientValue, type GradientType } from '../gradient';

interface Props {
  birds: Bird[];
  current: number;
  type: GradientType;
  angle: number;
  onSelect: (index: number) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function Browse({ birds, current, type, angle, onSelect }: Props) {
  const listRef = useRef<HTMLOListElement>(null);

  // On the mobile strip, keep the selected bird in view without touching the
  // page's vertical scroll (scrollIntoView would).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[current] as HTMLElement | undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [current]);

  return (
    <section class="section browse" aria-labelledby="browse-label">
      <h2 class="label" id="browse-label">
        <span>All birds</span>
        <span class="label__value">{birds.length}</span>
      </h2>
      <ol class="browse__list" ref={listRef}>
        {birds.map((bird, i) => (
          <li key={bird.slug}>
            <button
              type="button"
              class="bird"
              aria-current={i === current ? 'true' : undefined}
              onClick={() => onSelect(i)}
            >
              <span
                class="bird__thumb"
                style={{ backgroundImage: gradientValue({ type, angle, colors: bird.stops.map((s) => s.hex) }) }}
              />
              <span class="bird__index">{pad(i + 1)}</span>
              <span class="bird__name">{bird.name}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
