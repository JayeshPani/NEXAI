// Top bar (menu, points, swaps left) and Pip's live order ticker (simulated distance and time)
import { pointsFor } from '../game/scoring';
import { MAX_SWAPS, REPLAY_ORDERS, useGame, useSaved } from '../store';
import { m1, secs } from './format';

export function TopBar() {
  const { mode, swapsUsed, openMenu } = useGame();
  const points = pointsFor(useSaved());
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={openMenu}>Menu</button>
      <div className="title">
        <strong>{mode === 'challenge' ? 'The puzzle' : 'Free play'}</strong>
        <span>{mode === 'challenge' ? 'Beat the starting shelves in 10 swaps' : 'Started from jumbled shelves'}</span>
      </div>
      <div className={`points ${points > 0 ? 'up' : points < 0 ? 'down' : ''}`} aria-live="polite">
        <b>{points.toLocaleString()}</b> points
      </div>
      {mode === 'challenge' && (
        <div className="swaps" aria-label={`${MAX_SWAPS - swapsUsed} swaps left`}>
          {Array.from({ length: MAX_SWAPS }, (_, i) => <i key={i} className={i < swapsUsed ? 'used' : ''} />)}
        </div>
      )}
    </header>
  );
}

export function Hud() {
  const live = useGame(s => s.live);
  if (!live) return null;
  return (
    <div className="ticker" aria-live="off">
      <span>Order <b>{live.order}</b> of {REPLAY_ORDERS}</span>
      <span><b>{live.lines}</b> items</span>
      <span>walked <b>{m1(live.dist)}</b></span>
      <span><b>{secs(live.time)}</b></span>
    </div>
  );
}
