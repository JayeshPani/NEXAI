// A product card standing above every rack, always turned to the camera, so items are easy to see.
// Clicking or hovering a card is the same as clicking or hovering its shelf.
import { useEffect, useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useData } from '../../../core/appStore';
import { RACK_HEIGHT, rackCenter } from './coords';
import { buildCardAtlas, cellUv } from './cardAtlas';

export const CARD_SIZE = 1.05;

export function ShelfCards({ at, selected = null, hovered = null, onSlotClick, onSlotHover }: {
  at: number[]; selected?: number | null; hovered?: number | null;
  onSlotClick?: (slot: number) => void;
  onSlotHover?: (slot: number | null, e?: ThreeEvent<PointerEvent>) => void;
}) {
  const data = useData();
  const { tex: atlas, redraw } = useMemo(() => buildCardAtlas(data.products), [data.products]);
  useEffect(() => { document.fonts.ready.then(redraw); }, [redraw]);   // redraw once the font has loaded
  useEffect(() => () => atlas.dispose(), [atlas]);

  // One texture per product sharing the atlas image (uploaded once)
  const textures = useMemo(() => data.products.map(p => {
    const t = atlas.clone();
    const { offset, repeat } = cellUv(p.id);
    t.offset.set(...offset); t.repeat.set(...repeat);
    t.needsUpdate = true;
    return t;
  }), [atlas, data.products]);
  useEffect(() => () => textures.forEach(t => t.dispose()), [textures]);

  return (
    <group>
      {at.map((p, slot) => {
        const [x, , z] = rackCenter(slot);
        const lift = slot === selected || slot === hovered ? 0.25 : 0;
        const scale = slot === selected ? 1.15 : slot === hovered ? 1.08 : 1;
        return (
          <Billboard key={slot} position={[x, RACK_HEIGHT + 0.12 + CARD_SIZE / 2 + lift, z]} lockZ>
            <mesh
              scale={scale}
              onClick={onSlotClick && (e => { e.stopPropagation(); if (e.delta > 4) return; onSlotClick(slot); })}
              onPointerMove={onSlotHover && (e => { e.stopPropagation(); onSlotHover(slot, e); })}
              onPointerOut={onSlotHover && (() => onSlotHover(null))}
            >
              <planeGeometry args={[CARD_SIZE, CARD_SIZE]} />
              <meshBasicMaterial map={textures[p]} toneMapped={false} />
            </mesh>
          </Billboard>
        );
      })}
    </group>
  );
}
