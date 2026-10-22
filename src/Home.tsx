// Home: the three modules, one per MVP requirement, in the order data flows through them
import { useApp } from './core/appStore';

const MODULES = [
  { n: 1, id: 'data', title: 'Order data', body: 'See what we made from one month of real orders: the top 100 products, how often each is picked, and every order.' },
  { n: 2, id: 'twin', title: 'Warehouse replay', body: 'Watch Pip walk the aisles of a 3D warehouse to fetch each order, with live distance and time.' },
  { n: 3, id: 'game', title: 'Slotting game', body: 'Swap products between shelves, replay the same orders, and beat the fast-movers-first layout.' },
] as const;

export function Home() {
  const go = useApp(s => s.go);
  return (
    <div className="home">
      <header className="home-head">
        <h1 className="stamp small">Pick &amp; Pack</h1>
        <p>A digital twin of a warehouse picking floor, built on real November 2011 orders.</p>
      </header>
      <ol className="modules">
        {MODULES.map(m => (
          <li key={m.id}>
            <button className={`module-card m${m.n}`} onClick={() => go(m.id)}>
              <span className={`mod-num m${m.n}`}>{m.n}</span>
              <strong>{m.title}</strong>
              <span>{m.body}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
