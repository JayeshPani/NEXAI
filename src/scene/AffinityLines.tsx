// While a product is selected, draw lines to its top-3 affinity partners (Section 6.3)
import { Line } from '@react-three/drei';
import { useGame } from '../store';
import { RACK_HEIGHT, rackCenter } from './coords';

export function AffinityLines() {
  const data = useGame(s => s.data)!;
  const selected = useGame(s => s.selected);
  const at = useGame(s => s.at);
  const assign = useGame(s => s.assign);
  if (selected === null) return null;
  const top = (s: number): [number, number, number] => { const [x, , z] = rackCenter(s); return [x, RACK_HEIGHT + 0.25, z]; };
  return (
    <group>
      {data.topPartners[at[selected]].map(p => (
        <Line key={p} points={[top(selected), top(assign[p])]} color="#9b5de5" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
      ))}
    </group>
  );
}
