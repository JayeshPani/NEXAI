// Warehouse time rules for Holly & Ivy Gifts. Shown in the UI; every module scores with these.
import { L, pts } from './geometry';
import type { Product } from './types';

export const RULES = {
  walkSpeed: 1.0,                               // m/s
  handlingBase: 6,                              // s per order line, picked by hand (FL0)
  handlingPerFl: 4,                             // s per forklift/handling level: FL7 = 6 + 28 = 34 s
  classCheck: { A: 5, B: 2, C: 0 } as const,    // s per line: scan and seal for valuable stock
  forkliftFrom: 4,                              // FL4 and up needs a forklift in the aisle
  accessPerMetre: 2,                            // s per metre between the slot and the nearest cross aisle
};

export type Abc = keyof typeof RULES.classCheck;

/** Handling time for one line of a product: the same on every layout. */
export const handlingTime = (p: Product) =>
  RULES.handlingBase + RULES.handlingPerFl * p.fl + RULES.classCheck[p.abc];

/** Metres from a slot's pick point to the nearest cross aisle (front y = 0, back y = L). */
export const aisleDepth = (slot: number) => Math.min(pts[slot].y, L - pts[slot].y);

/** Extra time for forklift items to drive into the aisle and back out: depends on the slot. */
export const accessTime = (p: Product, slot: number) =>
  p.fl >= RULES.forkliftFrom ? RULES.accessPerMetre * aisleDepth(slot) : 0;

export const pickTime = (p: Product, slot: number) => handlingTime(p) + accessTime(p, slot);

/** pick[productId][slotId] = seconds to pick one line of that product from that slot. */
export const pickTable = (products: Product[]): number[][] =>
  products.map(p => Array.from({ length: 100 }, (_, s) => pickTime(p, s)));
