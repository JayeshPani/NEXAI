// Picker replay (Section 6.2): walks leg().pts between consecutive route stops, never its own
// waypoints, at 1 m/s × playback speed, pausing 10 s of sim time at each pick.
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { DOCK, leg, pts } from '../../../core/engine/geometry';
import { PICK_TIME, WALK_SPEED, routeOrder, slotsOf } from '../../../core/engine/sim';
import type { Order } from '../../../core/engine/types';
import { useReplay } from '../replayStore';
import { to3 } from './coords';

type Seg =
  | { kind: 'walk'; x0: number; y0: number; x1: number; y1: number; len: number; dur: number }
  | { kind: 'pick'; slot: number; dur: number };

function timeline(slotsPath: number[]): Seg[] {
  const segs: Seg[] = [];
  let cx = pts[DOCK].x, cy = pts[DOCK].y;
  for (let i = 1; i < slotsPath.length; i++) {
    for (const w of leg(pts[slotsPath[i - 1]], pts[slotsPath[i]]).pts) {
      const len = Math.abs(w.x - cx) + Math.abs(w.y - cy);   // every waypoint step is axis-aligned
      if (len > 1e-9) segs.push({ kind: 'walk', x0: cx, y0: cy, x1: w.x, y1: w.y, len, dur: len / WALK_SPEED });
      cx = w.x; cy = w.y;
    }
    if (slotsPath[i] !== DOCK) segs.push({ kind: 'pick', slot: slotsPath[i], dur: PICK_TIME });
  }
  return segs;
}

export function Picker({ orders, getAssign }: { orders: Order[]; getAssign: () => number[] }) {
  const group = useRef<Group>(null);
  const replayId = useReplay(s => s.replayId);
  const st = useRef({ order: -1, segs: [] as Seg[], seg: 0, segT: 0, t: 0, dist: 0, lastPush: 0, visited: -1, stop: -1, totalDist: 0, totalTime: 0 });

  useEffect(() => {
    st.current = { order: -1, segs: [], seg: 0, segT: 0, t: 0, dist: 0, lastPush: 0, visited: -1, stop: -1, totalDist: 0, totalTime: 0 };
    const d = pts[DOCK];
    group.current?.position.set(...to3(d.x, d.y));
  }, [replayId]);

  useFrame((_, delta) => {
    const g = useReplay.getState();
    if (!g.playing || !group.current) return;
    const s = st.current;
    let left = Math.min(delta, 0.1) * g.speed;   // seconds of sim time this frame

    const startOrder = (i: number) => {
      if (s.order >= 0) { s.totalDist += s.dist; s.totalTime += s.t; }
      s.order = i; s.seg = 0; s.segT = 0; s.t = 0; s.dist = 0; s.visited = -1; s.stop = -1;
      s.segs = timeline(routeOrder(slotsOf(orders[i], getAssign())).path);
    };
    if (s.order < 0) startOrder(0);

    while (left > 0) {
      if (s.seg >= s.segs.length) {
        if (s.order + 1 >= orders.length) {
          push(true);
          useReplay.setState({ playing: false });
          return;
        }
        startOrder(s.order + 1);
        continue;
      }
      const seg = s.segs[s.seg];
      if (seg.kind === 'pick' && s.visited !== s.seg) { s.visited = s.seg; s.stop++; g.visit(seg.slot); }
      const step = Math.min(left, seg.dur - s.segT);
      s.segT += step; s.t += step; left -= step;
      if (seg.kind === 'walk') {
        const f = seg.dur ? s.segT / seg.dur : 1;
        group.current.position.set(...to3(seg.x0 + (seg.x1 - seg.x0) * f, seg.y0 + (seg.y1 - seg.y0) * f));
        if (s.segT >= seg.dur) s.dist += seg.len;
      }
      if (s.segT >= seg.dur - 1e-9) { s.seg++; s.segT = 0; }
    }

    // HUD counters show simulated distance and time, throttled to ~10 Hz
    const now = performance.now();
    if (now - s.lastPush > 100) { s.lastPush = now; push(false); }

    function push(done: boolean) {
      const cur = s.segs[s.seg];
      const partial = cur?.kind === 'walk' ? cur.len * (s.segT / cur.dur) : 0;
      const o = orders[s.order];
      g.setLive({
        order: s.order + 1, orderId: o.id, lines: o.lines.length, dist: s.dist + partial, time: s.t, done,
        totalDist: s.totalDist + s.dist + partial, totalTime: s.totalTime + s.t, stop: s.stop,
      });
    }
  });

  return (
    <group ref={group}>
      {/* Pip: green vest, round head, yellow hard hat, eyes facing the camera */}
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.3, 0.9, 4, 12]} />
        <meshStandardMaterial color="#33a867" />
      </mesh>
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.3, 20, 16]} />
        <meshStandardMaterial color="#f6c99b" />
      </mesh>
      <mesh position={[0, 1.86, 0]}>
        <sphereGeometry args={[0.33, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffc93c" />
      </mesh>
      {[-0.11, 0.11].map(x => (
        <mesh key={x} position={[x, 1.72, 0.27]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshBasicMaterial color="#22395b" />
        </mesh>
      ))}
    </group>
  );
}
