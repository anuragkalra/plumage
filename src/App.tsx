import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { birds, type Bird } from './birds';
import { cssDeclaration, gradientValue, GRADIENT_TYPES, renderPng, type GradientType } from './gradient';
import { copyText, saveImage } from './share';
import { Hero } from './components/Hero';
import { Controls } from './components/Controls';
import { StopList, type EditableStop } from './components/StopList';
import { Browse } from './components/Browse';
import { ArrowLeftIcon, ArrowRightIcon } from './components/icons';

const EXPORTS = {
  wallpaper: { label: 'Wallpaper', width: 1290, height: 2796 },
  square: { label: 'Square', width: 1080, height: 1080 },
} as const;
type ExportKind = keyof typeof EXPORTS;

const PREFS_KEY = 'plumage:prefs';
const DEFAULT_PREFS = { type: 'linear' as GradientType, angle: 180 };

function loadPrefs(): { type: GradientType; angle: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null') as Partial<typeof DEFAULT_PREFS> | null;
    const type = GRADIENT_TYPES.includes(parsed?.type as GradientType) ? (parsed!.type as GradientType) : DEFAULT_PREFS.type;
    const angle = Number.isFinite(parsed?.angle) ? Math.min(360, Math.max(0, Math.round(parsed!.angle!))) : DEFAULT_PREFS.angle;
    return { type, angle };
  } catch {
    return DEFAULT_PREFS;
  }
}

function indexFromHash(): number | null {
  const slug = decodeURIComponent(location.hash.slice(1));
  const i = birds.findIndex((b) => b.slug === slug);
  return i === -1 ? null : i;
}

let nextId = 0;
const editable = (bird: Bird): EditableStop[] => bird.stops.map((s) => ({ ...s, id: `stop-${++nextId}` }));

const pad = (n: number) => String(n).padStart(2, '0');

export function App() {
  const [index, setIndex] = useState(() => indexFromHash() ?? 0);
  const bird = birds[index]!;
  const [stops, setStops] = useState(() => editable(bird));
  const [prefs, setPrefs] = useState(loadPrefs);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [status, setStatus] = useState('');
  const copiedTimer = useRef<number>();

  const spec = useMemo(
    () => ({ type: prefs.type, angle: prefs.angle, colors: stops.map((s) => s.hex) }),
    [prefs, stops],
  );
  const background = gradientValue(spec);
  const css = cssDeclaration(spec);

  const edited =
    stops.length !== bird.stops.length || stops.some((s, i) => s.hex !== bird.stops[i]?.hex);

  const select = useCallback((i: number) => {
    const n = (i + birds.length) % birds.length;
    setIndex(n);
    setStops(editable(birds[n]!));
  }, []);

  // Bird in the URL hash, so a link opens the same gradient.
  useEffect(() => {
    const target = `#${bird.slug}`;
    if (location.hash !== target) history.replaceState(null, '', target);
  }, [bird.slug]);

  useEffect(() => {
    const onHash = () => {
      const i = indexFromHash();
      if (i !== null) select(i);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [select]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Private mode or storage disabled; preferences just won't persist.
    }
  }, [prefs]);

  // ← / → browse birds when focus isn't in a control that uses arrows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      select(index + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, select]);

  const flash = (key: string, message: string) => {
    setCopied(key);
    setStatus(message);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(null), 1600);
  };

  const copy = async (key: string, text: string, message: string) => {
    try {
      await copyText(text);
      flash(key, message);
    } catch {
      setStatus('Copy failed. Select the text and copy it manually.');
    }
  };

  const exportPng = async (kind: ExportKind) => {
    if (busy) return;
    const { width, height } = EXPORTS[kind];
    setBusy(kind);
    setStatus(`Rendering ${width} by ${height} PNG`);
    try {
      // Let the busy state paint before the canvas work blocks the thread.
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const blob = await renderPng(spec, width, height);
      await saveImage(blob, `plumage-${bird.slug}-${width}x${height}.png`);
      setStatus(`Saved ${width} by ${height} PNG`);
    } catch {
      setStatus('Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div class="app">
      <div class="stage">
        <Hero
          background={background}
          fadeKey={bird.slug}
          label={`${prefs.type} gradient from the plumage of the ${bird.name}`}
          onSwipe={(dir) => select(index + dir)}
        />
      </div>

      <main class="panel">
        <header class="masthead">
          <div>
            <p class="wordmark">Plumage</p>
            <p class="tagline">Gradients from Connecticut birds</p>
          </div>
          <nav class="pager" aria-label="Browse birds">
            <button type="button" class="icon-btn" onClick={() => select(index - 1)} aria-label="Previous bird">
              <ArrowLeftIcon />
            </button>
            <span class="pager__count" aria-live="polite">
              {pad(index + 1)}
              <span class="pager__total">/{pad(birds.length)}</span>
            </span>
            <button type="button" class="icon-btn" onClick={() => select(index + 1)} aria-label="Next bird">
              <ArrowRightIcon />
            </button>
          </nav>
        </header>

        <section class="identity" key={bird.slug}>
          <h1 class="identity__name">{bird.name}</h1>
          <p class="identity__scientific">{bird.scientific}</p>
          <p class="identity__note">{bird.note}</p>
        </section>

        <section class="section" aria-labelledby="stops-label">
          <div class="label">
            <h2 id="stops-label">
              Stops <span class="label__value">{stops.length}</span>
            </h2>
            <div class="label__actions">
              <button type="button" class="text-btn" onClick={() => setStops((s) => s.slice().reverse())}>
                Reverse
              </button>
              <button type="button" class="text-btn" disabled={!edited} onClick={() => setStops(editable(bird))}>
                Reset
              </button>
            </div>
          </div>
          <StopList
            stops={stops}
            copiedKey={copied}
            onChange={setStops}
            onCopyHex={(stop) => copy(`hex:${stop.id}`, stop.hex, `Copied ${stop.hex}`)}
          />
        </section>

        <Controls
          type={prefs.type}
          angle={prefs.angle}
          onType={(type) => setPrefs((p) => ({ ...p, type }))}
          onAngle={(angle) => setPrefs((p) => ({ ...p, angle }))}
        />

        <section class="section" aria-labelledby="css-label">
          <h2 class="label" id="css-label">
            CSS
          </h2>
          <pre class="code">
            <code>{css}</code>
          </pre>
        </section>

        <div class="actions" role="group" aria-label="Copy and export">
          <button
            type="button"
            class="btn btn--primary"
            onClick={() => copy('css', css, 'Copied CSS')}
          >
            <span class="btn__label">{copied === 'css' ? 'Copied' : 'Copy CSS'}</span>
            <span class="btn__meta">background</span>
          </button>
          {(Object.keys(EXPORTS) as ExportKind[]).map((kind) => {
            const { label, width, height } = EXPORTS[kind];
            return (
              <button
                key={kind}
                type="button"
                class="btn"
                aria-busy={busy === kind}
                disabled={busy !== null && busy !== kind}
                onClick={() => exportPng(kind)}
              >
                <span class="btn__label">{busy === kind ? 'Rendering…' : label}</span>
                <span class="btn__meta">
                  {width}×{height}
                </span>
              </button>
            );
          })}
        </div>

        <Browse
          birds={birds}
          current={index}
          type={prefs.type}
          angle={prefs.angle}
          onSelect={select}
        />

        <footer class="footer">
          <p>
            {birds.length} common birds of Connecticut and New England. Colors sampled by eye from breeding
            plumage, head to tail.
          </p>
        </footer>

        <p class="sr-only" role="status" aria-live="polite">
          {status}
        </p>
      </main>
    </div>
  );
}
