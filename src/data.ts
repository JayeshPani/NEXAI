// Loads the JSON contracts from public/data (Plan v2, Section 3.3)
import { partnersOf } from './engine/layouts';
import type { Affinity, Orders, Product } from './engine/types';

export type GameData = {
  products: Product[]; orders: Orders; affinity: Affinity;
  partners: number[][];      // all affinity partners, strongest first (optimizer)
  topPartners: number[][];   // top 3 per product (hint lines)
  minPicks: number; maxPicks: number;
};

const get = async <T>(f: string): Promise<T> => {
  const r = await fetch(`${import.meta.env.BASE_URL}data/${f}`);
  if (!r.ok) throw new Error(`Could not load ${f} (${r.status})`);
  return r.json();
};

export async function loadData(): Promise<GameData> {
  const [products, orders, affinity] = await Promise.all([
    get<Product[]>('products.json'), get<Orders>('orders.json'), get<Affinity>('affinity.json'),
  ]);
  return {
    products, orders, affinity,
    partners: partnersOf(affinity), topPartners: partnersOf(affinity, 3),
    minPicks: Math.min(...products.map(p => p.picksTrain)),
    maxPicks: Math.max(...products.map(p => p.picksTrain)),
  };
}
