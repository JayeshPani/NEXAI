// Scoreboard (Section 6.4): Original, Baseline, Yours, AI Suggest on all test-week orders
import type { Stats } from '../engine/sim';
import { useGame } from '../store';
import { m, m1, pct, secs } from './format';

function Row({ name, s, ref0, tone }: { name: string; s?: Stats | null; ref0: Stats; tone?: string }) {
  return (
    <tr className={tone}>
      <th>{name}</th>
      {s ? (<>
        <td>{m(s.totalDist)}</td><td>{m1(s.meanDist)}</td><td>{m1(s.medianDist)}</td>
        <td>{m1(s.p90Dist)}</td><td>{secs(s.avgTime)}</td>
        <td className={s.totalDist < ref0.totalDist ? 'good' : s.totalDist > ref0.totalDist ? 'bad' : ''}>
          {pct(s.totalDist / ref0.totalDist - 1)}
        </td>
      </>) : <td colSpan={6} className="muted">not run yet</td>}
    </tr>
  );
}

export function Scoreboard() {
  const { original, baseline, yours, ai, data } = useGame();
  if (!original || !baseline || !data) return null;
  return (
    <div className="panel scoreboard">
      <table>
        <thead>
          <tr><th />
            <th>Total</th><th>Mean</th><th>Median</th><th>p90</th><th>Avg time</th><th>vs Original</th></tr>
        </thead>
        <tbody>
          <Row name="Original" s={original} ref0={original} />
          <Row name="Baseline" s={baseline} ref0={original} />
          <Row name="Yours" s={yours} ref0={original} tone="you" />
          <Row name="AI Suggest" s={ai.stats} ref0={original} tone="ai" />
        </tbody>
      </table>
      <p className="note">
        Score: all {data.orders.test.length} test-week orders (22–30 Nov 2011) · distance per order ·
        pick time is 10 s per line for every layout, so only walking differs
      </p>
    </div>
  );
}
