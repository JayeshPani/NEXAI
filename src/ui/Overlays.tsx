// Tooltip with Δ preview, toast and the Challenge end screen (Sections 6.3, 7)
import { samePickPoint } from '../engine/layouts';
import { useGame } from '../store';
import { pct, signed } from './format';

export function Tooltip({ x, y }: { x: number; y: number }) {
  const { hovered, selected, preview, data, at, mode, swapsUsed, ended } = useGame();
  if (hovered === null || !data || ended) return null;
  const p = data.products[at[hovered]];
  const n = data.orders.test.length;
  const twin = selected !== null && hovered !== selected && samePickPoint(selected, hovered);
  const outOfSwaps = mode === 'challenge' && swapsUsed >= 10;
  return (
    <div className="tooltip" style={{ left: x + 16, top: y + 16 }}>
      <div className="tt-name">{p.name}</div>
      <div className="tt-meta">{p.code} · {p.picksTrain} picks in train weeks · slot {hovered}</div>
      {twin && <div className="tt-hint">No change — same pick point</div>}
      {preview !== null && !ended && !outOfSwaps && (
        <div className={`tt-delta ${preview < 0 ? 'good' : preview > 0 ? 'bad' : ''}`}>
          Swap: {signed(preview)} total · {signed(preview / n)} per order
        </div>
      )}
      {selected === null && !ended && <div className="tt-hint">Click to select, then click another slot to swap</div>}
    </div>
  );
}

export function Toast() {
  const toast = useGame(s => s.toast);
  return toast ? <div className="toast" key={toast.id}>{toast.text}</div> : null;
}

export function EndScreen() {
  const { ended, yours, baseline, original, reset, setMode } = useGame();
  if (!ended || !yours || !baseline || !original) return null;
  const vsBase = yours.totalDist / baseline.totalDist - 1;
  const won = vsBase < 0;
  return (
    <div className="modal-backdrop">
      <div className="panel modal">
        <h2>{won ? 'You beat the Baseline' : 'The Baseline holds'}</h2>
        <div className="big-stats">
          <div><span className={won ? 'good' : 'bad'}>{pct(vsBase)}</span><label>vs Baseline</label></div>
          <div><span className={yours.totalDist < original.totalDist ? 'good' : 'bad'}>{pct(yours.totalDist / original.totalDist - 1)}</span><label>vs Original</label></div>
        </div>
        <p className="note">Walking distance over all test-week orders after 10 swaps.
          {won ? ' Grouping products that are ordered together paid off.' : ' Tip: use the purple affinity lines to put products ordered together side by side.'}</p>
        <div className="modal-actions">
          <button className="primary" onClick={reset}>Play again</button>
          <button onClick={() => setMode('sandbox')}>Open Sandbox</button>
        </div>
      </div>
    </div>
  );
}
