// engine/sim.ts — routing and scoring with a per-order cache (Plan v2, Section 5.2)
import { D, DOCK } from './geometry';
import type { Order } from './types';

export const WALK_SPEED = 1.0;   // m/s
export const PICK_TIME = 10;     // s per order line

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
  totalDist: number; meanDist: number; medianDist: number; p90Dist: number; avgTime: number;
};

export function makeEngine(orders: Order[], assign: number[]) {
  const ordersByProduct: number[][] = Array.from({ length: 100 }, () => []);
  orders.forEach((o, i) => new Set(o.lines.map(l => l.p)).forEach(p => ordersByProduct[p].push(i)));
  const orderDist = orders.map(o => routeOrder(slotsOf(o, assign)).total);
  const lines = orders.reduce((n, o) => n + o.lines.length, 0);

  function swapDelta(p1: number, p2: number) {
    const affected = new Set([...ordersByProduct[p1], ...ordersByProduct[p2]]);
    [assign[p1], assign[p2]] = [assign[p2], assign[p1]];
    let delta = 0; const next = new Map<number, number>();
    for (const i of affected) {
      const d = routeOrder(slotsOf(orders[i], assign)).total;
      next.set(i, d); delta += d - orderDist[i];
    }
    return { delta,
      commit: () => next.forEach((d, i) => (orderDist[i] = d)),
      undo:   () => ([assign[p1], assign[p2]] = [assign[p2], assign[p1]]) };
  }

  function stats(): Stats {
    const sorted = [...orderDist].sort((a, b) => a - b);
    const total = sorted.reduce((s, d) => s + d, 0);
    const q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
    return { totalDist: total, meanDist: total / orders.length,
             medianDist: q(0.5), p90Dist: q(0.9),
             avgTime: (total / WALK_SPEED + lines * PICK_TIME) / orders.length };     // seconds
  }
  return { assign, swapDelta, stats };
}

export const scoreLayout = (orders: Order[], assign: number[]) => makeEngine(orders, [...assign]).stats();
