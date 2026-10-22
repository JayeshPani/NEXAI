import { useEffect, useState } from 'react';
import { loadData } from './data';
import { Scene } from './scene/Scene';
import { useGame } from './store';
import { Controls } from './ui/Controls';
import { Hud, TopBar } from './ui/Hud';
import { Menu } from './ui/Menu';
import { EndScreen, SwapFeedback, Toast, Tooltip } from './ui/Overlays';
import { Scoreboard } from './ui/Scoreboard';

export default function App() {
  const ready = useGame(s => s.data !== null);
  const screen = useGame(s => s.screen);
  const hoverSlot = useGame(s => s.hoverSlot);
  const [error, setError] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadData().then(d => useGame.getState().init(d)).catch(e => setError(String(e.message ?? e)));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') useGame.setState({ selected: null, preview: null }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (error) return <div className="center-msg">Pip couldn't load the orders: {error}. Check your connection and reload.</div>;
  if (!ready) return <div className="center-msg">Unpacking the boxes…</div>;

  return (
    <div className={`app ${screen}`}>
      {screen === 'game' && <TopBar />}
      <div className="stage">
        <Scene onHover={(slot, e) => {
          if (useGame.getState().screen !== 'game') return;
          if (e) setPointer({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
          if (slot !== useGame.getState().hovered) hoverSlot(slot);
        }} />
        {screen === 'game' && (<>
          <Hud />
          <Legend />
          <Tip />
          <SwapFeedback />
          <Toast />
          <Tooltip x={pointer.x} y={pointer.y} />
        </>)}
      </div>
      {screen === 'game' && (<>
        <Controls />
        <Scoreboard />
        <EndScreen />
      </>)}
      {screen === 'menu' && <Menu />}
    </div>
  );
}

function Legend() {
  const heatmap = useGame(s => s.heatmap);
  return (
    <div className="legend">
      {heatmap
        ? <span><i className="sw heat" /> Pip's visits while you watch</span>
        : <span><i className="sw picks" /> rarely picked → picked a lot</span>}
      <span><i className="sw partner" /> bought together</span>
    </div>
  );
}

// One gentle hint at a time, based on what the player is doing
function Tip() {
  const { selected, swapsUsed, mode, ai } = useGame();
  let text = 'Click a shelf to pick it up.';
  if (selected !== null) text = 'Purple lines show what people buy with it. Point at a shelf to see the points, then click to swap.';
  else if (mode === 'challenge' && swapsUsed > 0 && swapsUsed < 10) text = `${10 - swapsUsed} swaps left. Shelves near the packing desk are quickest for Pip.`;
  else if (mode === 'sandbox' && ai.status === 'idle') text = 'Free play: swap as much as you like, or ask the robot for ideas.';
  return <div className="tip"><span className="pip-face" aria-hidden="true" />{text}</div>;
}
