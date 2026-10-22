// Simulated annealing over swaps (Plan v2, Section 8), shared by the worker and the tuning test.
import { nearestProductTo } from '../../core/engine/layouts';
import { makeEngine } from '../../core/engine/sim';
import type { Order } from '../../core/engine/types';

export type AnnealOptions = {
  budgetMs?: number; T0?: number; Tend?: number; random?: () => number;
  onProgress?: (cur: number, it: number, elapsed: number) => void;
};

// Propose: move a product next to one of its affinity partners (70%) or swap at random
function propose(assign: number[], partners: number[][], random: () => number): [number, number] {
  const p1 = Math.floor(random() * 100);
  const ps = partners[p1];
  const p2 = ps.length && random() < 0.7
    ? nearestProductTo(ps[Math.floor(random() * ps.length)], assign)
    : Math.floor(random() * 100);
  return [p1, p2];
}

export function anneal(train: Order[], assign: number[], partners: number[][], opts: AnnealOptions = {}) {
  const { budgetMs = 5000, T0 = 30, Tend = 1, random = Math.random, onProgress } = opts;
  const eng = makeEngine(train, [...assign]);
  let cur = eng.stats().totalDist, T = T0, it = 0;
  let best = cur, bestAssign = [...eng.assign];
  const t0 = performance.now();
  for (let elapsed = 0; elapsed < budgetMs; elapsed = performance.now() - t0) {
    // Cool geometrically from T0 to Tend over the time budget, so a slow laptop still finishes cold
    T = T0 * Math.pow(Tend / T0, elapsed / budgetMs);
    const [p1, p2] = propose(eng.assign, partners, random);
    if (p1 === p2) continue;
    const s = eng.swapDelta(p1, p2);
    if (s.delta < 0 || random() < Math.exp(-s.delta / T)) { s.commit(); cur += s.delta; }
    else s.undo();
    if (cur < best - 1e-9) { best = cur; bestAssign = [...eng.assign]; }
    if (++it % 500 === 0) onProgress?.(cur, it, performance.now() - t0);
  }
  return { assign: bestAssign, cur: best, it };
}

// "Start where roughly half of worsening moves are accepted": T0 = median(worsening delta) / ln 2
export function tuneT0(train: Order[], assign: number[], partners: number[][], samples = 2000, random = Math.random) {
  const eng = makeEngine(train, [...assign]);
  const worse: number[] = [];
  for (let k = 0; k < samples; k++) {
    const [p1, p2] = propose(eng.assign, partners, random);
    if (p1 === p2) continue;
    const s = eng.swapDelta(p1, p2);
    if (s.delta > 1e-9) worse.push(s.delta);
    s.undo();
  }
  worse.sort((a, b) => a - b);
  return worse.length ? worse[Math.floor(worse.length / 2)] / Math.LN2 : 30;
}
