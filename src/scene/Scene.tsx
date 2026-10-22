// <Canvas> with an angled perspective camera and capped OrbitControls (Section 6.1)
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AffinityLines } from './AffinityLines';
import { Floor } from './Floor';
import { Picker } from './Picker';
import { Racks } from './Racks';
import { CENTER } from './coords';

export function Scene({ onHover }: { onHover: (slot: number | null, e?: ThreeEvent<PointerEvent>) => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [CENTER[0], 20, 12], fov: 42 }} onPointerMissed={() => onHover(null)}>
      <color attach="background" args={['#0f1419']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 20, 10]} intensity={1.6} />
      <Floor />
      <Racks onHover={onHover} />
      <AffinityLines />
      <Picker />
      <OrbitControls
        makeDefault target={CENTER} enablePan={false}
        minDistance={14} maxDistance={42} minPolarAngle={0.25} maxPolarAngle={1.15}
      />
    </Canvas>
  );
}
