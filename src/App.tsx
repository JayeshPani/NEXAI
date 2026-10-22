import { useEffect, useState } from 'react';
import { loadData } from './data';
import { Scene } from './scene/Scene';
import { useGame } from './store';
import { Controls } from './ui/Controls';
import { Hud } from './ui/Hud';
import { EndScreen, Toast, Tooltip } from './ui/Overlays';
import { Scoreboard } from './ui/Scoreboard';

export default function App() {
  const ready = useGame(s => s.data !== null);
  const hoverSlot = useGame(s => s.hoverSlot);
  const [error, setError] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadData().then(d => useGame.getState().init(d)).catch(e => setError(String(e.message ?? e)));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') useGame.setState({ selected: null, preview: null }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (error) return <div className="center-msg">Could not load data: {error}</div>;
  if (!ready) return <div className="center-msg">Loading November 2011 orders…</div>;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Warehouse Digital Twin</h1>
          <p>Re-slot 100 products and replay real November 2011 orders from Online Retail II</p>
        </div>
      </header>
      <div className="stage">
        <Scene onHover={(slot, e) => {
          if (e) setPointer({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
          if (slot !== useGame.getState().hovered) hoverSlot(slot);
        }} />
        <Hud />
        <Legend />
        <Tooltip x={pointer.x} y={pointer.y} />
        <Toast />
      </div>
      <Controls />
      <Scoreboard />
      <EndScreen />
    </div>
  );
}

function Legend() {
  const heatmap = useGame(s => s.heatmap);
  return (
    <div className="panel legend">
      {heatmap
        ? <><i className="sw heat" /> visits during replay</>
        : <><i className="sw pop" /> train-week picks (low → high)</>}
      <span><i className="sw sel" /> selected</span>
      <span><i className="sw partner" /> often ordered together</span>
    </div>
  );
}
