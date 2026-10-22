// A label on top of every shelf (seen by the angled camera): the product's atlas cell
import { useEffect, useMemo } from 'react';
import type { Texture } from 'three';
import { useData } from '../../../core/appStore';
import { BAY_LEN, RACK_DEPTH, RACK_HEIGHT, rackCenter } from './coords';
import { buildShelfAtlas, cellUv } from './shelfAtlas';

export function ShelfFaces({ at }: { at: number[] }) {
  const data = useData();
  const { tex: atlas, redraw } = useMemo(() => buildShelfAtlas(data.products), [data.products]);
  useEffect(() => { document.fonts.ready.then(redraw); }, [redraw]);   // redraw once the rounded font has loaded
  useEffect(() => () => atlas.dispose(), [atlas]);

  // One texture per product sharing the atlas image (uploaded once); planes pick by product id
  const textures = useMemo(() => data.products.map(p => {
    const t = atlas.clone();
    const { offset, repeat } = cellUv(p.id);
    t.offset.set(...offset); t.repeat.set(...repeat);
    t.needsUpdate = true;
    return t;
  }), [atlas, data.products]);
  useEffect(() => () => textures.forEach((t: Texture) => t.dispose()), [textures]);

  return (
    <group>
      {at.map((p, slot) => {
        const [x, , z] = rackCenter(slot);
        return (
          <mesh key={slot} position={[x, RACK_HEIGHT + 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <planeGeometry args={[RACK_DEPTH * 0.86, BAY_LEN * 0.86]} />
            <meshBasicMaterial map={textures[p]} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}
