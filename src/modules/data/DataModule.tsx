// Module 1 — Order data (MVP 1): what the pre-processing step produced from one month of order lines.
// Read-only view of products.json, orders.json and affinity.json.
import { useMemo, useState } from 'react';
import { useData } from '../../core/appStore';
import type { Order } from '../../core/engine/types';
import { ModuleHeader } from '../../core/ui/ModuleHeader';

type Tab = 'products' | 'orders' | 'pairs';

export function DataModule() {
  const data = useData();
  const [tab, setTab] = useState<Tab>('products');
  const { train, test } = data.orders;
  const sizes = useMemo(() => [...train, ...test].map(o => o.lines.length).sort((a, b) => a - b), [train, test]);
  const lines = sizes.reduce((a, b) => a + b, 0);
  const median = sizes[Math.floor(sizes.length / 2)], p90 = sizes[Math.floor(sizes.length * 0.9)];

  return (
    <div className="app data">
      <ModuleHeader n={1} title="Order data" subtitle="One month of real order lines from Online Retail II, turned into JSON" />
      <main className="data-main">
        <section className="facts-row" aria-label="Summary">
          <Fact big={data.products.length.toString()} small="top products by picks" />
          <Fact big={(train.length + test.length).toLocaleString()} small="orders in November 2011" />
          <Fact big={lines.toLocaleString()} small="order lines (picks)" />
          <Fact big={`${median} / ${p90}`} small="items per order, median / p90" />
          <Fact big={`${train.length.toLocaleString()} / ${test.length}`} small="orders to learn from (1–21 Nov) / to test on (22–30 Nov)" />
        </section>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>Products and pick counts</button>
          <button role="tab" aria-selected={tab === 'orders'} className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>Orders</button>
          <button role="tab" aria-selected={tab === 'pairs'} className={tab === 'pairs' ? 'on' : ''} onClick={() => setTab('pairs')}>Bought together</button>
        </div>
        {tab === 'products' && <Products />}
        {tab === 'orders' && <OrderList />}
        {tab === 'pairs' && <Pairs />}

        <details className="rules">
          <summary>How the data was cleaned</summary>
          <ul>
            <li>Cancelled invoices (number starts with “C”) are removed, as are rows with quantity or price of 0 or less.</li>
            <li>Only real products are kept: codes of five digits plus up to two letters (no postage, fees or vouchers). Codes are upper-cased so 85049a and 85049A merge.</li>
            <li>Month used: November 2011. The top 100 products are ranked by order lines in 1–21 Nov only, so the test week stays unseen.</li>
            <li>Lines for other products are dropped, and orders left empty are dropped. Large wholesale orders are kept.</li>
            <li>Files: <code>products.json</code>, <code>orders.json</code> (train / test), <code>affinity.json</code> (top 500 pairs), made by <code>preprocess.py</code>.</li>
          </ul>
        </details>
      </main>
    </div>
  );
}

function Fact({ big, small }: { big: string; small: string }) {
  return <div className="fact"><b>{big}</b><span>{small}</span></div>;
}

function Products() {
  const { products, maxPicks } = useData();
  const [q, setQ] = useState('');
  const shown = products.filter(p => (p.name + p.code).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <section className="panel-card">
      <input className="search" type="search" placeholder="Search 100 products" value={q} onChange={e => setQ(e.target.value)} aria-label="Search products" />
      <ol className="bars">
        {shown.map(p => (
          <li key={p.id}>
            <span className="rank">{p.id + 1}</span>
            <span className="pname">{p.name} <small>{p.code}</small></span>
            <span className="bar"><i style={{ width: `${(p.picksTrain / maxPicks) * 100}%` }} /></span>
            <span className="num">{p.picksTrain}</span>
          </li>
        ))}
        {shown.length === 0 && <li className="empty-row">No product matches “{q}”.</li>}
      </ol>
      <p className="note">Picks = order lines in 1–21 Nov. Bar length is relative to the most-picked product.</p>
    </section>
  );
}

function OrderList() {
  const { orders, products } = useData();
  const [split, setSplit] = useState<'train' | 'test'>('test');
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(40);
  const list: Order[] = orders[split];
  return (
    <section className="panel-card">
      <div className="seg" role="group" aria-label="Which weeks">
        <button className={split === 'train' ? 'on' : ''} onClick={() => { setSplit('train'); setLimit(40); }}>Learn weeks · {orders.train.length}</button>
        <button className={split === 'test' ? 'on' : ''} onClick={() => { setSplit('test'); setLimit(40); }}>Test week · {orders.test.length}</button>
      </div>
      <ul className="orders">
        {list.slice(0, limit).map(o => (
          <li key={o.id}>
            <button className="order-row" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>
              <span>Order {o.id}</span>
              <span className="muted">{new Date(o.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="num">{o.lines.length} items</span>
            </button>
            {open === o.id && (
              <ul className="order-lines">
                {o.lines.map(l => <li key={l.p}><span>{products[l.p].name}</span><span className="num">×{l.q}</span></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {limit < list.length && <button onClick={() => setLimit(limit + 80)}>Show more ({list.length - limit} left)</button>}
    </section>
  );
}

function Pairs() {
  const { affinity, products } = useData();
  const top = affinity.slice(0, 30), max = top[0]?.[2] ?? 1;
  return (
    <section className="panel-card">
      <ol className="bars pairs">
        {top.map(([a, b, n]) => (
          <li key={`${a}-${b}`}>
            <span className="pname">{products[a].name} <small>+</small> {products[b].name}</span>
            <span className="bar"><i style={{ width: `${(n / max) * 100}%` }} /></span>
            <span className="num">{n}</span>
          </li>
        ))}
      </ol>
      <p className="note">Orders in 1–21 Nov that contained both products. Top 30 of the 500 pairs kept for the game's hints.</p>
    </section>
  );
}
