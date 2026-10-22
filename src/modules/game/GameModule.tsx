// Module 3 — Slotting game (MVP 3): swap products between slots, replay the same orders and compare
// walking distance and pick time against the automatic baseline (fast movers nearest the dock).
import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../core/appStore';
import { useReplay } from '../twin/replayStore';
import { AffinityLines } from '../twin/scene/AffinityLines';
import { WarehouseScene } from '../twin/scene/Scene';
import { ColourLegend } from '../twin/ui/ColourBy';
import { Ticker } from '../twin/ui/Ticker';
import { useGame } from './gameStore';
import { BeforeAfter } from './ui/BeforeAfter';
import { Controls } from './ui/Controls';
import { GameHeader } from './ui/Hud';
import { Menu } from './ui/Menu';
import { EndScreen, SwapFeedback, SwapTooltip, Toast } from './ui/Overlays';
import { Scoreboard } from './ui/Scoreboard';

export function GameModule() {
  const data = useData();
  const g = useGame();
  const { colourBy, visits } = useReplay();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const init = useGame(s => s.init);
  useEffect(() => { init(data); }, [data, init]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') useGame.getState().deselect(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const partnerSlots = useMemo(() => g.selected === null ? undefined
    : new Set(data.topPartners[g.at[g.selected]].map(p => g.assign[p])), [g.selected, g.at, g.assign, data]);

  if (!g.engine) return null;
  const playing = g.view === 'play';

  return (
    <div className="app game">
      <GameHeader />
      <div className="stage">
        <WarehouseScene
          orders={data.sample} getAssign={() => useGame.getState().engine!.assign}
          racks={{
            at: g.at, colourBy, visits, selected: g.selected, hovered: g.hovered, partnerSlots,
            onSlotClick: playing ? g.clickSlot : undefined,
            onSlotHover: playing ? (slot, e) => {
              if (e) setPointer({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
              if (slot !== useGame.getState().hovered) g.hoverSlot(slot);
            } : undefined,
          }}
        >
          {g.selected !== null && <AffinityLines from={g.selected} toSlots={[...(partnerSlots ?? [])]} />}
        </WarehouseScene>
        {playing && (<>
          <Ticker hideIdle />
          <BeforeAfter />
          <ColourLegend extra={<span><i className="sw partner" /> ordered together</span>} />
          <Tip />
          <SwapFeedback />
          <Toast />
          <SwapTooltip x={pointer.x} y={pointer.y} />
        </>)}
        {g.view === 'menu' && <Menu />}
      </div>
      {playing && (<>
        <Controls />
        <Scoreboard />
        <EndScreen />
      </>)}
    </div>
  );
}

// One contextual hint at a time
function Tip() {
  const { selected, swapsUsed, mode, ai } = useGame();
  let text = 'Select a shelf to start a swap.';
  if (selected !== null) text = 'Dashed lines link products ordered together. Hover a shelf to preview, click to swap.';
  else if (mode === 'challenge' && swapsUsed > 0 && swapsUsed < 10) text = `${10 - swapsUsed} swaps left. Fast movers belong near the dock; forklift items (FL4+) at the aisle ends.`;
  else if (mode === 'sandbox' && ai.status === 'idle') text = 'Sandbox: unlimited swaps. Run AI Suggest to compare.';
  return <div className="tip">{text}</div>;
}
