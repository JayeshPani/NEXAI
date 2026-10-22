// engine/sim.ts — routing and scoring with a per-order cache (Plan v2, Section 5.2).
// Each order caches its walking distance and its time: walk / speed + per-line pick time from rules.ts.
import { D, DOCK } from './geometry';
import { RULES } from './rules';
import type { Order } from './types';

export const WALK_SPEED = RULES.walkSpeed;   // m/s

export function routeOrder(slots: number[]) {
  const left = new Set(slots); let cur = DOCK, total = 0; const path = [DOCK];
  while (left.size) {
    let best = -1, bd = Infinity;
    for (const s of left) if (D[cur][s] < bd || (D[cur][s] === bd && s < best)) { bd = D[cur][s]; best = s; }
    total += bd; cur = best; left.delete(best); path.push(best);
  }
  total += D[cur][DOCK]; path.push(DOCK);
  return { total, path };
}

export const slotsOf = (o: Order, assign: number[]) => [...new Set(o.lines.map(l => assign[l.p]))];

export type Stats = {
  totalDist: number; meanDist: number; medianDist: number; p90Dist: number;
  totalTime: number; avgTime: number; medianTime: number; p90Time: number;   // seconds
};

const spread = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const total = sorted.reduce((s, d) => s + d, 0);
  const q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
  return { total, mean: total / xs.length, median: q(0.5), p90: q(0.9) };
};

/** pick[productId][slotId] = seconds per line (see rules.ts pickTable). */
export function makeEngine(orders: Order[], assign: number[], pick: number[][]) {
  const ordersByProduct: number[][] = Array.from({ length: 100 }, () => []);
  orders.forEach((o, i) => new Set(o.lines.map(l => l.p)).forEach(p => ordersByProduct[p].push(i)));
  const walkOf = (o: Order) => routeOrder(slotsOf(o, assign)).total;
  const pickOf = (o: Order) => o.lines.reduce((t, l) => t + pick[l.p][assign[l.p]], 0);
  const orderDist = orders.map(walkOf);
  const orderTime = orders.map((o, i) => orderDist[i] / WALK_SPEED + pickOf(o));

  // delta is in seconds (the score); dDist in metres
  function swapDelta(p1: number, p2: number) {
    const affected = new Set([...ordersByProduct[p1], ...ordersByProduct[p2]]);
    [assign[p1], assign[p2]] = [assign[p2], assign[p1]];
    let delta = 0, dDist = 0; const next = new Map<number, [number, number]>();
    for (const i of affected) {
      const d = walkOf(orders[i]), t = d / WALK_SPEED + pickOf(orders[i]);
      next.set(i, [d, t]); delta += t - orderTime[i]; dDist += d - orderDist[i];
    }
    return { delta, dDist,
      commit: () => next.forEach(([d, t], i) => { orderDist[i] = d; orderTime[i] = t; }),
      undo:   () => ([assign[p1], assign[p2]] = [assign[p2], assign[p1]]) };
  }

  function stats(): Stats {
    const d = spread(orderDist), t = spread(orderTime);
    return { totalDist: d.total, meanDist: d.mean, medianDist: d.median, p90Dist: d.p90,
             totalTime: t.total, avgTime: t.mean, medianTime: t.median, p90Time: t.p90 };
  }
  return { assign, swapDelta, stats };
}

export const scoreLayout = (orders: Order[], assign: number[], pick: number[][]) =>
  makeEngine(orders, [...assign], pick).stats();
