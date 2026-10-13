import { GRADIENT_TYPES, usesAngle, type GradientType } from '../gradient';

const TICKS = [0, 90, 180, 270, 360];

interface Props {
  type: GradientType;
  angle: number;
  onType: (type: GradientType) => void;
  onAngle: (angle: number) => void;
}

export function Controls({ type, angle, onType, onAngle }: Props) {
  const angleActive = usesAngle(type);

  return (
    <>
      <section class="section" aria-labelledby="type-label">
        <h2 class="label" id="type-label">
          Type
        </h2>
        <div class="segmented" role="radiogroup" aria-labelledby="type-label">
          {GRADIENT_TYPES.map((t) => (
            <label key={t} class="segmented__option">
              <input
                type="radio"
                name="gradient-type"
                value={t}
                checked={type === t}
                onChange={() => onType(t)}
              />
              <span>{t[0]!.toUpperCase() + t.slice(1)}</span>
            </label>
          ))}
        </div>
      </section>

      <section class={`section angle${angleActive ? '' : ' is-disabled'}`} aria-labelledby="angle-label">
        <div class="label">
          <label id="angle-label" for="angle">
            Angle
          </label>
          <output for="angle" class="label__value">
            {angleActive ? `${angle}°` : 'n/a for radial'}
          </output>
        </div>
        <input
          id="angle"
          class="range"
          type="range"
          min={0}
          max={360}
          step={1}
          value={angle}
          disabled={!angleActive}
          onInput={(e) => onAngle(Number(e.currentTarget.value))}
        />
        <div class="ticks">
          {TICKS.map((t) => (
            <button
              key={t}
              type="button"
              class={`ticks__tick${angle === t ? ' is-active' : ''}`}
              style={{ '--p': t / 360 }}
              disabled={!angleActive}
              onClick={() => onAngle(t)}
              aria-label={`Set angle to ${t} degrees`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
