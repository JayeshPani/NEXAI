// Grown-up stats (Section 6.4): all four layouts on every test-week order, time and walking
import type { Stats } from '../../../core/engine/sim';
import { RULES } from '../../../core/engine/rules';
import { m, m1, pct, secs } from '../../../core/format';
import { useGame } from '../gameStore';

function Row({ name, plan, s, ref0, tone }: { name: string; plan: string; s?: Stats | null; ref0: Stats; tone?: string }) {
  return (
    <tr className={tone}>
      <th>{name} <small>{plan}</small></th>
      {s ? (<>
        <td>{secs(s.avgTime)}</td><td>{secs(s.medianTime)}</td><td>{secs(s.p90Time)}</td>
        <td>{m(s.totalDist)}</td><td>{m1(s.meanDist)}</td><td>{m1(s.medianDist)}</td><td>{m1(s.p90Dist)}</td>
        <td className={s.totalTime < ref0.totalTime ? 'good' : s.totalTime > ref0.totalTime ? 'bad' : ''}>
          {pct(s.totalTime / ref0.totalTime - 1)}
        </td>
      </>) : <td colSpan={8} className="muted">Ask the robot to fill this in</td>}
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
              <th>Time / order</th><th>Median</th><th>p90</th>
              <th>Total walk</th><th>Walk / order</th><th>Median</th><th>p90</th><th>Time vs Jumbled</th></tr>
          </thead>
          <tbody>
            <Row name="Jumbled shelves" plan="Original" s={original} ref0={original} />
            <Row name="Starting shelves" plan="Baseline" s={baseline} ref0={original} />
            <Row name="Your shelves" plan="Yours" s={yours} ref0={original} tone="you" />
            <Row name="Robot's shelves" plan="AI Suggest" s={ai.stats} ref0={original} tone="ai" />
          </tbody>
        </table>
        <p className="note">
          Scored on all {data.orders.test.length} orders from 22–30 Nov 2011. Time per order = walking at {RULES.walkSpeed} m/s
          {' '}+ handling ({RULES.handlingBase} s + {RULES.handlingPerFl} s per FL level, +{RULES.classCheck.A} s for class A,
          {' '}+{RULES.classCheck.B} s for B) + forklift access for FL {RULES.forkliftFrom}+ ({RULES.accessPerMetre} s per metre into the aisle).
          {' '}The robot (simulated annealing) learned on 1–21 Nov and never saw these orders.
        </p>
      </div>
    </details>
  );
}
