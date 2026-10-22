// Tooltip with swap preview, swap pop-up, toast and the puzzle's end screen
import { useState } from 'react';
import { addScore, qualifies } from '../leaderboard';
import { duration, pointsFor, starsFor, swapVerdict } from '../scoring';
import { samePickPoint } from '../../../core/engine/layouts';
import { ShelfTooltip } from '../../twin/TwinModule';
import { useGame, useSaved } from '../gameStore';
import { Stars } from './Stars';

export function SwapTooltip({ x, y }: { x: number; y: number }) {
  const { hovered, selected, preview, data, at, mode, swapsUsed, ended } = useGame();
  if (hovered === null || !data || ended) return null;
  const twin = selected !== null && hovered !== selected && samePickPoint(selected, hovered);
  const outOfSwaps = mode === 'challenge' && swapsUsed >= 10;
  const pts = preview === null ? null : pointsFor(-preview);
  return (
    <ShelfTooltip slot={hovered} product={at[hovered]} x={x} y={y}>
      {twin && <div className="tt-hint">Same spot for Pip, no change</div>}
      {pts !== null && !outOfSwaps && (
        <div className={`tt-points ${pts > 0 ? 'good' : pts < 0 ? 'bad' : ''}`}>
          Swap here: {pts > 0 ? '+' : ''}{pts.toLocaleString()} points ({pts > 0 ? 'saves' : 'costs'} {Math.abs(pts).toLocaleString()} s)
        </div>
      )}
      {selected === null && <div className="tt-hint">Click to pick up this shelf</div>}
      {selected === hovered && <div className="tt-hint">Click again to put it back</div>}
    </ShelfTooltip>
  );
}

export function SwapFeedback() {
  const feedback = useGame(s => s.feedback);
  if (!feedback) return null;
  const v = swapVerdict(feedback.delta);
  const pts = pointsFor(-feedback.delta);
  return (
    <div className={`pop ${v.tone}`} key={feedback.id} role="status">
      <b>{pts > 0 ? '+' : ''}{pts.toLocaleString()}</b> {v.text}
    </div>
  );
}

export function Toast() {
  const toast = useGame(s => s.toast);
  return toast ? <div className="toast" key={toast.id} role="status">{toast.text}</div> : null;
}

export function EndScreen() {
  const { ended, mode, reset, openMenu, setPanel, swapsUsed } = useGame();
  const saved = useSaved();
  const [name, setName] = useState('');
  const [savedScore, setSavedScore] = useState(false);
  if (!ended || mode !== 'challenge') return null;
  const points = pointsFor(saved);
  const stars = starsFor(saved);
  const canSave = qualifies(points) && !savedScore;
  const title = ['Slower than before, try again!', 'Nice work!', 'Great shelving!', 'Superstar shelver!'][stars];
  const again = () => { setSavedScore(false); setName(''); reset(); };
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-labelledby="end-title">
        <Stars n={stars} animate />
        <h2 id="end-title">{title}</h2>
        <p className="end-points"><b>{points.toLocaleString()}</b> points</p>
        <p className="end-copy">
          {saved > 0
            ? `With ${swapsUsed} swaps, the team saves ${duration(saved)} of picking over the last week of November.`
            : 'Tip: put products bought together side by side near the packing desk, and forklift items at the aisle ends.'}
        </p>
        {stars < 3 && <p className="next-star">Next star at {[1, 1500, 4000][stars].toLocaleString()} points</p>}
        {canSave && (
          <form className="save" onSubmit={e => { e.preventDefault(); addScore({ name: name.trim() || 'Player', points, stars, at: new Date().toISOString() }); setSavedScore(true); }}>
            <label htmlFor="nick">Add your name to the high scores</label>
            <div>
              <input id="nick" maxLength={14} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="off" />
              <button className="primary" type="submit">Save</button>
            </div>
          </form>
        )}
        {savedScore && <p className="saved-msg">Saved! <button className="link" onClick={() => { openMenu(); setPanel('scores'); }}>See high scores</button></p>}
        <div className="modal-actions">
          <button className="primary" onClick={again}>Play again</button>
          <button onClick={openMenu}>Menu</button>
        </div>
      </div>
    </div>
  );
}
