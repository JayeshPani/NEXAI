// Holly & Ivy Gifts: product categories, ABC and FL colours shared by every module
import type { Category, Product } from './engine/types';

export const BUSINESS = {
  name: 'Holly & Ivy Gifts',
  tagline: 'UK gift and Christmas-décor wholesaler · November 2011 rush',
};

export const CATEGORY: Record<Category, { icon: string; colour: string }> = {
  'Christmas':        { icon: '🎄', colour: '#2e9e5b' },
  'Lights & candles': { icon: '💡', colour: '#f2c230' },
  'Bags & storage':   { icon: '👜', colour: '#e86a92' },
  'Kitchen & baking': { icon: '🧁', colour: '#f4a259' },
  'Party & paper':    { icon: '🎉', colour: '#9b5de5' },
  'Cosy & warm':      { icon: '🧣', colour: '#e4572e' },
  'Games & crafts':   { icon: '🎲', colour: '#3d8bfd' },
  'Home & garden':    { icon: '🏡', colour: '#8d6e63' },
  'Gifts & gadgets':  { icon: '🎁', colour: '#00b8a9' },
};

export const ABC_COLOUR = { A: '#e4572e', B: '#ffc93c', C: '#b8bec6' } as const;
export const ABC_LABEL = { A: 'Class A · top 20% by sales value', B: 'Class B · next 30%', C: 'Class C · last 50%' } as const;

/** FL0 (by hand) light → FL7 (forklift) dark */
export const flColour = (fl: number) => `hsl(205, 70%, ${88 - fl * 9}%)`;
export const FL_LABEL = (fl: number) => (fl === 0 ? 'by hand' : fl < 4 ? 'trolley' : fl < 7 ? 'forklift' : 'forklift, pallet');

/** Two words for a shelf label: skip filler like "Set Of 3" */
export function shortName(p: Product) {
  const words = p.name.replace(/[^A-Za-z' ]/g, ' ').split(/\s+/)
    .filter(w => w && !/^(set|of|pack|box|the|and|a|in|\d+)$/i.test(w));
  return words.slice(0, 2).join(' ');
}
