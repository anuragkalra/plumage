import raw from './data/birds.json';

export interface PlumageStop {
  /** Body region the color was sampled from, e.g. "Crest". */
  part: string;
  /** Six-digit hex color, e.g. "#D42A2F". */
  hex: string;
}

export interface Bird {
  slug: string;
  name: string;
  scientific: string;
  /** 3–5 stops in plumage order (head to tail where it makes sense). */
  stops: PlumageStop[];
  note: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

function validate(list: Bird[]): Bird[] {
  if (import.meta.env.DEV) {
    for (const bird of list) {
      if (bird.stops.length < 2) console.warn(`[birds.json] ${bird.slug} needs at least 2 stops`);
      for (const stop of bird.stops) {
        if (!HEX.test(stop.hex)) console.warn(`[birds.json] ${bird.slug} has invalid hex "${stop.hex}"`);
      }
    }
  }
  return list.map((bird) => ({
    ...bird,
    stops: bird.stops.map((s) => ({ ...s, hex: s.hex.toUpperCase() })),
  }));
}

export const birds: Bird[] = validate(raw satisfies Bird[]);
