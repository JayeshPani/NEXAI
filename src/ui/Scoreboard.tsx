// Grown-up stats (Section 6.4): all four layouts on every test-week order
import type { Stats } from '../engine/sim';
import { useGame } from '../store';
import { m, m1, pct, secs } from './format';

function Row({ name, plan, s, ref0, tone }: { name: string; plan: string; s?: Stats | null; ref0: Stats; tone?: string }) {
  return (
    <tr className={tone}>
      <th>{name} <small>{plan}</small></th>
      {s ? (<>
        <td>{m(s.totalDist)}</td><td>{m1(s.meanDist)}</td><td>{m1(s.medianDist)}</td>
        <td>{m1(s.p90Dist)}</td><td>{secs(s.avgTime)}</td>
        <td className={s.totalDist < ref0.totalDist ? 'good' : s.totalDist > ref0.totalDist ? 'bad' : ''}>
          {pct(s.totalDist / ref0.totalDist - 1)}
        </td>
      </>) : <td colSpan={6} className="muted">Ask the robot to fill this in</td>}
    </tr>
  );
}

export function Scoreboard() {
  const { original, baseline, yours, ai, data } = useGame();
  if (!original || !baseline || !data) return null;
  return (
    <details className="stats">
      <summary>Grown-up stats</summary>
      <div className="stats-body">
        <table>
          <thead>
            <tr><th />
              <th>Total walk</th><th>Mean</th><th>Median</th><th>p90</th><th>Avg time</th><th>vs Jumbled</th></tr>
          </thead>
          <tbody>
            <Row name="Jumbled shelves" plan="Original" s={original} ref0={original} />
            <Row name="Starting shelves" plan="Baseline" s={baseline} ref0={original} />
            <Row name="Your shelves" plan="Yours" s={yours} ref0={original} tone="you" />
            <Row name="Robot's shelves" plan="AI Suggest" s={ai.stats} ref0={original} tone="ai" />
          </tbody>
        </table>
        <p className="note">
          Scored on all {data.orders.test.length} orders from 22–30 Nov 2011, distance per order. Pip watches
          {' '}25 sample orders from that week. Picking takes 10 s per item on every layout, so only walking differs.
          The robot (simulated annealing) learned on 1–21 Nov and never saw these orders.
        </p>
      </div>
    </details>
  );
}
