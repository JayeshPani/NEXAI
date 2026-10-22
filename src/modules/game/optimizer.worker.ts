// optimizer.worker.ts — runs AI Suggest off the main thread (Plan v2, Section 8).
// Tuned on the train weeks; the caller scores the result on the test week with a fresh engine.
import { anneal, tuneT0 } from './anneal';
import type { Order } from '../../core/engine/types';

export type OptimizerRequest = {
  assign: number[]; train: Order[]; affinityPartners: number[][]; pick: number[][]; budgetMs?: number; T0?: number;
};
export type OptimizerMessage =
  | { type: 'progress'; cur: number; it: number; elapsed: number }
  | { type: 'done'; assign: number[]; cur: number; it: number };

self.onmessage = ({ data: { assign, train, affinityPartners, pick, budgetMs = 5000, T0 } }: MessageEvent<OptimizerRequest>) => {
  // Tune T on the train data: start where roughly half of worsening moves are accepted
  const T = T0 ?? tuneT0(train, assign, affinityPartners, pick);
  const result = anneal(train, assign, affinityPartners, pick, {
    budgetMs, T0: T, Tend: 5,
    onProgress: (cur, it, elapsed) => postMessage({ type: 'progress', cur, it, elapsed } satisfies OptimizerMessage),
  });
  postMessage({ type: 'done', ...result } satisfies OptimizerMessage);
};
