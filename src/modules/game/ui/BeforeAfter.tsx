// Before vs after on the same test-week orders: walking distance and pick time per order (MVP 3)
import { m1, secs } from '../../../core/format';
import { useGame } from '../gameStore';

export function BeforeAfter() {
  const { mode, original, baseline, yours } = useGame();
  const before = mode === 'challenge' ? baseline : original;
  if (!before || !yours) return null;
  const dDist = yours.meanDist - before.meanDist, dTime = yours.avgTime - before.avgTime;
  const tone = (d: number) => (d < -1e-9 ? 'good' : d > 1e-9 ? 'bad' : '');
  const sign = (d: number) => (d < -1e-9 ? '−' : d > 1e-9 ? '+' : '±');
  return (
    <div className="before-after" aria-label="Before and after, per order">
      <div>
        <span className="ba-label">Before ({mode === 'challenge' ? 'starting shelves' : 'jumbled shelves'})</span>
        <span className="ba-val">{m1(before.meanDist)} · {secs(before.avgTime)}</span>
      </div>
      <div>
        <span className="ba-label">After (your shelves)</span>
        <span className="ba-val">{m1(yours.meanDist)} · {secs(yours.avgTime)}</span>
      </div>
      <div className={tone(dDist)}>
        <span className="ba-label">Change per order</span>
        <span className="ba-val">{sign(dDist)}{m1(Math.abs(dDist))} · {sign(dTime)}{secs(Math.abs(dTime))}</span>
      </div>
    </div>
  );
}
