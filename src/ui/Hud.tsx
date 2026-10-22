// Live replay counters (Section 6.4): simulated distance and time, not wall-clock
import { REPLAY_ORDERS, useGame } from '../store';
import { m1, secs } from './format';

export function Hud() {
  const live = useGame(s => s.live);
  const mode = useGame(s => s.mode);
  const swapsUsed = useGame(s => s.swapsUsed);
  return (
    <div className="panel hud">
      <div className="hud-title">
        <span className={`mode-pill ${mode}`}>{mode === 'challenge' ? 'Challenge' : 'Sandbox'}</span>
        {mode === 'challenge' && <span className="swaps"><b>{10 - swapsUsed}</b> swaps left</span>}
      </div>
      <div className="hud-grid">
        <div><label>Order</label><span>{live ? `${live.order} / ${REPLAY_ORDERS}` : '—'}</span></div>
        <div><label>Lines</label><span>{live?.lines ?? '—'}</span></div>
        <div><label>Distance</label><span>{live ? m1(live.dist) : '—'}</span></div>
        <div><label>Time</label><span>{live ? secs(live.time) : '—'}</span></div>
      </div>
      <p className="note">Replay: {REPLAY_ORDERS} sample orders from the test week</p>
    </div>
  );
}
