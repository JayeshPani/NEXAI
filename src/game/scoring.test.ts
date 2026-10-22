import { describe, expect, it } from 'vitest';
import { pointsFor, starsFor, swapVerdict } from './scoring';

describe('scoring', () => {
  it('gives 1 point per metre saved', () => {
    expect(pointsFor(523.4)).toBe(523);
    expect(pointsFor(-80.6)).toBe(-81);
  });
  it('awards stars at 0 / 1,000 / 2,500 m saved', () => {
    expect(starsFor(-10)).toBe(0);
    expect(starsFor(0)).toBe(0);
    expect(starsFor(1)).toBe(1);
    expect(starsFor(999)).toBe(1);
    expect(starsFor(1000)).toBe(2);
    expect(starsFor(2500)).toBe(3);
  });
  it('labels swaps by how much walking they save', () => {
    expect(swapVerdict(-300).tone).toBe('great');
    expect(swapVerdict(-20).tone).toBe('good');
    expect(swapVerdict(0).tone).toBe('meh');
    expect(swapVerdict(40).tone).toBe('oops');
  });
});
