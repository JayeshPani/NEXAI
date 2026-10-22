// AI Suggest (Section 8): improves the train score and always returns a valid layout
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { anneal, tuneT0 } from './anneal';
import { baselineLayout, partnersOf } from '../../core/engine/layouts';
import { pickTable } from '../../core/engine/rules';
import { scoreLayout } from '../../core/engine/sim';
import type { Affinity, Orders, Product } from '../../core/engine/types';

const load = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../../../public/data/${f}`, import.meta.url), 'utf8'));
const products = load<Product[]>('products.json');
const orders = load<Orders>('orders.json');
const partners = partnersOf(load<Affinity>('affinity.json'));
const pick = pickTable(products);

describe('anneal', () => {
  it('returns a permutation that does not lose to its starting point on train', () => {
    let seed = 42;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const base = baselineLayout(products);
    const T0 = tuneT0(orders.train, base, partners, pick, 300, random);
    const r = anneal(orders.train, base, partners, pick, { budgetMs: 400, T0, Tend: 5, random });
    expect([...r.assign].sort((a, b) => a - b)).toEqual([...Array(100).keys()]);
    expect(r.cur).toBeCloseTo(scoreLayout(orders.train, r.assign, pick).totalTime, 6);
    expect(r.cur).toBeLessThanOrEqual(scoreLayout(orders.train, base, pick).totalTime);
  });
});
