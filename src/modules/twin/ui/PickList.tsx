// The current order as Pip sees it: items in the order Pip visits them, ticked off as they are picked
import { useMemo } from 'react';
import { useData } from '../../../core/appStore';
import { routeOrder, slotsOf } from '../../../core/engine/sim';
import { useReplay } from '../replayStore';

export function PickList({ assign }: { assign: number[] }) {
  const data = useData();
  const live = useReplay(s => s.live);
  const order = live ? data.sample[live.order - 1] : data.sample[0];
  const visits = useMemo(() => {
    const at: number[] = []; assign.forEach((s, p) => (at[s] = p));
    const qty = new Map(order.lines.map(l => [l.p, l.q]));
    return routeOrder(slotsOf(order, assign)).path.slice(1, -1).map(slot => ({ slot, p: at[slot], q: qty.get(at[slot]) ?? 0 }));
  }, [order, assign]);
  const done = live ? (live.done ? visits.length : live.stop + 1) : 0;
  return (
    <aside className="picklist">
      <h3>Order {order.id}</h3>
      <p className="note">{new Date(order.t).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {visits.length} items</p>
      <ol>
        {visits.map((v, i) => (
          <li key={v.slot} className={i < done ? 'picked' : i === done && live && !live.done ? 'next' : ''}>
            <span className="check" aria-hidden="true">{i < done ? '✓' : ''}</span>
            <span className="pname">{data.products[v.p].name}</span>
            <span className="qty">×{v.q}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
