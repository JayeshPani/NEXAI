// Module 2 — Warehouse replay (MVP 2): the digital twin replays real orders on the as-received layout.
// Read-only: no swapping, scoring or optimiser (those live in the game module).
import { useEffect, useState } from 'react';
import { productImage } from '../../core/productImages';
import { CategoryIcon } from '../../core/ui/CategoryIcon';
import { useData } from '../../core/appStore';
import { ABC_LABEL, FL_LABEL } from '../../core/categories';
import { pts } from '../../core/engine/geometry';
import { productAt } from '../../core/engine/layouts';
import { RULES, accessTime, handlingTime } from '../../core/engine/rules';
import { ModuleHeader } from '../../core/ui/ModuleHeader';
import { Tooltip } from '../../core/ui/Tooltip';
import { useReplay } from './replayStore';
import { WarehouseScene } from './scene/Scene';
import { AisleFocus } from './ui/AisleFocus';
import { ColourBySwitch, ColourLegend } from './ui/ColourBy';
import { PickList } from './ui/PickList';
import { ReplayControls } from './ui/ReplayControls';
import { Ticker } from './ui/Ticker';

export function TwinModule() {
  const data = useData();
  const assign = data.originalAssign;
  const at = productAt(assign);
  const { colourBy, visits, reset } = useReplay();
  const [hover, setHover] = useState<{ slot: number; x: number; y: number } | null>(null);
  useEffect(() => { reset(); }, [reset]);

  return (
    <div className="app twin">
      <ModuleHeader n={2} title="Warehouse replay" subtitle="The picker walks the aisles to each product and back to the packing dock" />
      <div className="twin-body">
        <div className="stage">
          <WarehouseScene
            orders={data.sample} getAssign={() => assign}
            racks={{
              at, colourBy, visits, hovered: hover?.slot ?? null,
              onSlotHover: (slot, e) => setHover(slot === null ? null : { slot, x: e?.nativeEvent.clientX ?? 0, y: e?.nativeEvent.clientY ?? 0 }),
            }}
          />
          <Ticker showTotals />
          <ColourLegend />
          {hover && <ShelfTooltip slot={hover.slot} product={at[hover.slot]} x={hover.x} y={hover.y} />}
        </div>
        <PickList assign={assign} />
      </div>
      <div className="controls">
        <ReplayControls />
        <ColourBySwitch />
        <AisleFocus />
        <p className="note controls-note">
          Replaying {data.sample.length} real orders from 22–30 Nov 2011 on the shelves as received (sorted by product code).
          Walking {RULES.walkSpeed} m/s; each pick takes {RULES.handlingBase} s + {RULES.handlingPerFl} s per FL level, +{RULES.classCheck.A} s for class A,
          {' '}and forklift items (FL {RULES.forkliftFrom}+) add {RULES.accessPerMetre} s per metre into the aisle.
        </p>
      </div>
    </div>
  );
}

/** Product card for a hovered shelf: category, class, FL and pick time on this shelf */
export function ShelfTooltip({ slot, product, x, y, children }: { slot: number; product: number; x: number; y: number; children?: React.ReactNode }) {
  const p = useData().products[product];
  const access = accessTime(p, slot);
  return (
    <Tooltip x={x} y={y}>
      <img className="tt-photo" src={productImage(p)} alt="" />
      <div className="tt-name"><CategoryIcon category={p.category} size={18} /> {p.name}</div>
      <div className="tt-meta">{p.category} · £{p.price.toFixed(2)} · shelf {slot}, aisle {pts[slot].aisle + 1}</div>
      <div className="tt-tags">
        <span className={`tag abc-${p.abc}`}>{ABC_LABEL[p.abc]}</span>
        <span className="tag fl">FL{p.fl} · {FL_LABEL(p.fl)}</span>
      </div>
      <div className="tt-meta">
        {handlingTime(p)} s per pick{access ? ` + ${access.toFixed(0)} s forklift access here` : ''} · picked {p.picksTrain}× in 1–21 Nov
      </div>
      {children}
    </Tooltip>
  );
}
