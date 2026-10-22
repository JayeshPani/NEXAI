// Module 3 — Slotting game (MVP 3): swap products between slots, replay the same orders and compare
// walking distance and pick time against the automatic baseline (fast movers nearest the dock).
import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../core/appStore';
import { useReplay } from '../twin/replayStore';
import { AffinityLines } from '../twin/scene/AffinityLines';
import { WarehouseScene } from '../twin/scene/Scene';
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
  const { heatmap, visits } = useReplay();
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
            at: g.at, heatmap, visits, selected: g.selected, hovered: g.hovered, partnerSlots,
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
          <div className="legend">
            {heatmap ? <span><i className="sw heat" /> Pip's visits while you watch</span> : <span><i className="sw picks" /> rarely picked → picked a lot</span>}
            <span><i className="sw partner" /> bought together</span>
          </div>
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

// One gentle hint at a time, based on what the player is doing
function Tip() {
  const { selected, swapsUsed, mode, ai } = useGame();
  let text = 'Click a shelf to pick it up.';
  if (selected !== null) text = 'Purple lines show what people buy with it. Point at a shelf to see the points, then click to swap.';
  else if (mode === 'challenge' && swapsUsed > 0 && swapsUsed < 10) text = `${10 - swapsUsed} swaps left. Shelves near the packing desk are quickest for Pip.`;
  else if (mode === 'sandbox' && ai.status === 'idle') text = 'Free play: swap as much as you like, or ask the robot for ideas.';
  return <div className="tip"><span className="pip-face" aria-hidden="true" />{text}</div>;
}
