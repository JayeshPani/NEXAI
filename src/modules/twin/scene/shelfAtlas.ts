// One canvas atlas with a label cell per product: category colour and icon, short name, class and FL badges.
// Cells are per product, so a swap only moves which cell a shelf shows; nothing is redrawn.
import { CanvasTexture, SRGBColorSpace } from 'three';
import { ABC_COLOUR, CATEGORY, shortName } from '../../../core/categories';
import type { Product } from '../../../core/engine/types';

export const GRID = 10, CELL = 200;

export function buildShelfAtlas(products: Product[]) {
  const c = document.createElement('canvas');
  c.width = c.height = GRID * CELL;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = () => { draw(c, products); tex.needsUpdate = true; };   // clones share the image, so all update
  redraw();
  return { tex, redraw };
}

function draw(c: HTMLCanvasElement, products: Product[]) {
  const ctx = c.getContext('2d')!;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of products) {
    const x = (p.id % GRID) * CELL, y = Math.floor(p.id / GRID) * CELL;
    const cat = CATEGORY[p.category];
    ctx.fillStyle = cat.colour; ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(ctx, x + 10, y + 10, CELL - 20, CELL - 20, 22); ctx.fill();
    ctx.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.fillText(cat.icon, x + CELL / 2, y + 98);
    ctx.fillStyle = '#22395b'; ctx.font = 'bold 25px "Baloo 2", system-ui, sans-serif';
    fitText(ctx, shortName(p), x + CELL / 2, y + 160, CELL - 30);
    badge(ctx, p.abc, x + 38, y + 38, ABC_COLOUR[p.abc], p.abc === 'B' ? '#22395b' : '#fff', 48);
    badge(ctx, `FL${p.fl}`, x + CELL - 48, y + 38, '#22395b', '#fff', 64);
  }
}

/** UV offset/repeat for a product's cell (canvas y runs down, texture v runs up) */
export const cellUv = (id: number) => ({
  offset: [(id % GRID) / GRID, 1 - (Math.floor(id / GRID) + 1) / GRID] as [number, number],
  repeat: [1 / GRID, 1 / GRID] as [number, number],
});

function badge(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, bg: string, fg: string, w = 40) {
  ctx.fillStyle = bg; roundRect(ctx, cx - w / 2, cy - 22, w, 44, 12); ctx.fill();
  ctx.fillStyle = fg; ctx.font = 'bold 30px "Baloo 2", system-ui, sans-serif'; ctx.fillText(text, cx, cy + 2);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number) {
  let size = 25;
  while (size > 14 && ctx.measureText(text).width > max) { size -= 1; ctx.font = `bold ${size}px "Baloo 2", system-ui, sans-serif`; }
  ctx.fillText(text, x, y);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
