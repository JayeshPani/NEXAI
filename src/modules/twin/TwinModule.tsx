// Module 2 — Warehouse replay (MVP 2): the digital twin replays real orders on the as-received layout.
// Read-only: no swapping, scoring or optimiser (those live in the game module).
import { useEffect, useState } from 'react';
import { useData } from '../../core/appStore';
import { pts } from '../../core/engine/geometry';
import { productAt } from '../../core/engine/layouts';
import { ModuleHeader } from '../../core/ui/ModuleHeader';
import { Tooltip } from '../../core/ui/Tooltip';
import { useReplay } from './replayStore';
import { WarehouseScene } from './scene/Scene';
import { PickList } from './ui/PickList';
import { ReplayControls } from './ui/ReplayControls';
import { Ticker } from './ui/Ticker';

export function TwinModule() {
  const data = useData();
  const assign = data.originalAssign;
  const at = productAt(assign);
  const { heatmap, visits, reset } = useReplay();
  const [hover, setHover] = useState<{ slot: number; x: number; y: number } | null>(null);
  useEffect(() => { reset(); }, [reset]);

  return (
    <div className="app twin">
      <ModuleHeader n={2} title="Warehouse replay" subtitle="Pip walks the aisles to each product and back to the packing desk" />
      <div className="twin-body">
        <div className="stage">
          <WarehouseScene
            orders={data.sample} getAssign={() => assign}
            racks={{
              at, heatmap, visits, hovered: hover?.slot ?? null,
              onSlotHover: (slot, e) => setHover(slot === null ? null : { slot, x: e?.nativeEvent.clientX ?? 0, y: e?.nativeEvent.clientY ?? 0 }),
            }}
          />
          <Ticker showTotals />
          <div className="legend">
            {heatmap ? <span><i className="sw heat" /> Pip's visits so far</span> : <span><i className="sw picks" /> rarely picked → picked a lot</span>}
          </div>
          {hover && (
            <Tooltip x={hover.x} y={hover.y}>
              <div className="tt-name">{data.products[at[hover.slot]].name}</div>
              <div className="tt-meta">Shelf {hover.slot} · aisle {pts[hover.slot].aisle + 1} · picked {data.products[at[hover.slot]].picksTrain} times in 1–21 Nov</div>
            </Tooltip>
          )}
        </div>
        <PickList assign={assign} />
      </div>
      <div className="controls">
        <ReplayControls />
        <p className="note controls-note">
          Replaying {data.sample.length} real orders from 22–30 Nov 2011 on the shelves as received (sorted by product code).
          Walking 1 m/s, picking 10 s per item, single-order trips from the packing desk.
        </p>
      </div>
    </div>
  );
}
