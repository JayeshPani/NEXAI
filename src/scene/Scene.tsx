// <Canvas> with an angled perspective camera and capped OrbitControls (Section 6.1)
import { useEffect } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { AffinityLines } from './AffinityLines';
import { Floor } from './Floor';
import { Picker } from './Picker';
import { Racks } from './Racks';
import { CENTER } from './coords';

export function Scene({ onHover }: { onHover: (slot: number | null, e?: ThreeEvent<PointerEvent>) => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [CENTER[0], 20, 12], fov: 42 }} onPointerMissed={() => onHover(null)}>
      <color attach="background" args={['#9adbff']} />
      <hemisphereLight args={['#ffffff', '#ffe9c7', 1.3]} />
      <directionalLight position={[8, 20, 10]} intensity={1.6} />
      <Floor />
      <Racks onHover={onHover} />
      <AffinityLines />
      <Picker />
      <FitCamera />
      <OrbitControls
        makeDefault target={CENTER} enablePan={false}
        minDistance={14} maxDistance={60} minPolarAngle={0.25} maxPolarAngle={1.15}
      />
    </Canvas>
  );
}

// Pull the camera back on narrow (portrait) screens so all five aisles fit
function FitCamera() {
  const camera = useThree(s => s.camera);
  const controls = useThree(s => s.controls) as { update: () => void } | null;
  const aspect = useThree(s => s.size.width / s.size.height);
  useEffect(() => {
    if (!Number.isFinite(aspect) || aspect <= 0) return;   // canvas not measured yet
    const dist = aspect >= 1.2 ? 28 : 28 + (1.2 - aspect) * 34;
    const target = new Vector3(...CENTER);
    camera.position.copy(camera.position.clone().sub(target).normalize().multiplyScalar(dist).add(target));
    camera.lookAt(target);
    controls?.update();
  }, [aspect, camera, controls]);
  return null;
}
