// 100 rack slots as one InstancedMesh (one draw call). Colours: popularity, heatmap or selection.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { samePickPoint } from '../engine/layouts';
import { useGame } from '../store';
import { BAY_LEN, RACK_DEPTH, RACK_HEIGHT, rackCenter } from './coords';

const COLD = new Color('#1f4e79'), MID = new Color('#3a9e9a'), HOT = new Color('#f0a030');
const HEAT_LO = new Color('#262c36'), HEAT_HI = new Color('#ff4d4d');
const SELECTED = new Color('#ffffff'), PARTNER = new Color('#d2a8ff'), DISABLED = new Color('#4a4f57');

export function Racks({ onHover }: { onHover: (slot: number | null, e?: ThreeEvent<PointerEvent>) => void }) {
  const ref = useRef<InstancedMesh>(null);
  const data = useGame(s => s.data)!;
  const at = useGame(s => s.at);
  const selected = useGame(s => s.selected);
  const hovered = useGame(s => s.hovered);
  const heatmap = useGame(s => s.heatmap);
  const visits = useGame(s => s.visits);
  const assign = useGame(s => s.assign);
  const clickSlot = useGame(s => s.clickSlot);

  useLayoutEffect(() => {
    const o = new Object3D();
    for (let s = 0; s < 100; s++) {
      o.position.set(...rackCenter(s));
      o.updateMatrix();
      ref.current!.setMatrixAt(s, o.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, []);

  const partnerSlots = useMemo(() => {
    if (selected === null) return new Set<number>();
    return new Set(data.topPartners[at[selected]].map(p => assign[p]));
  }, [selected, at, assign, data]);

  // setColorAt for all 100 instances, then instanceColor.needsUpdate (Section 6.1)
  useEffect(() => {
    const mesh = ref.current!;
    const c = new Color();
    const maxVisits = Math.max(1, ...visits);
    for (let s = 0; s < 100; s++) {
      if (heatmap) c.copy(HEAT_LO).lerp(HEAT_HI, Math.sqrt(visits[s] / maxVisits));
      else {
        const f = (data.products[at[s]].picksTrain - data.minPicks) / (data.maxPicks - data.minPicks || 1);
        if (f < 0.5) c.copy(COLD).lerp(MID, f * 2); else c.copy(MID).lerp(HOT, f * 2 - 1);
      }
      if (selected !== null) {
        if (s === selected) c.copy(SELECTED);
        else if (samePickPoint(s, selected)) c.copy(DISABLED);   // not a valid target
        else if (partnerSlots.has(s)) c.copy(PARTNER);
      }
      if (s === hovered && s !== selected) c.offsetHSL(0, 0, 0.18);
      mesh.setColorAt(s, c);
    }
    mesh.instanceColor!.needsUpdate = true;
  }, [at, selected, hovered, heatmap, visits, partnerSlots, data]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, 100]}
      onClick={e => { e.stopPropagation(); if (e.delta > 4) return; clickSlot(e.instanceId!); }}
      onPointerMove={e => { e.stopPropagation(); onHover(e.instanceId ?? null, e); }}
      onPointerOut={() => onHover(null)}
    >
      <boxGeometry args={[RACK_DEPTH * 0.92, RACK_HEIGHT, BAY_LEN * 0.92]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}
