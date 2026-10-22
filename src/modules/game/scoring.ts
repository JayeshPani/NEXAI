// Kid-friendly scoring: 1 point per metre the picker no longer walks over the whole test week.
// Star thresholds come from a greedy 10-swap search on the test week (~3,750 m is near perfect).
export const STAR_THRESHOLDS = [0, 1000, 2500] as const;   // metres saved for 1, 2, 3 stars
export const FOOTBALL_PITCH = 105;                           // metres

export const pointsFor = (metresSaved: number) => Math.round(metresSaved);

export function starsFor(metresSaved: number): 0 | 1 | 2 | 3 {
  if (metresSaved >= STAR_THRESHOLDS[2]) return 3;
  if (metresSaved >= STAR_THRESHOLDS[1]) return 2;
  if (metresSaved > STAR_THRESHOLDS[0]) return 1;
  return 0;
}

// Feedback for one swap; delta is the change in total walking (negative is good)
export function swapVerdict(delta: number): { text: string; tone: 'great' | 'good' | 'meh' | 'oops' } {
  if (delta < -150) return { text: 'Amazing swap!', tone: 'great' };
  if (delta < -50) return { text: 'Great swap!', tone: 'great' };
  if (delta < -0.5) return { text: 'Nice!', tone: 'good' };
  if (delta <= 0.5) return { text: 'No change', tone: 'meh' };
  return { text: 'Oops, more walking', tone: 'oops' };
}

export const pitches = (metres: number) => Math.max(0, metres / FOOTBALL_PITCH);
