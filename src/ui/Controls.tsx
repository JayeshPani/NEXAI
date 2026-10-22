// Controls: watch Pip (replay), speed, busy shelves (heatmap), ask the robot (AI Suggest)
import { pointsFor } from '../game/scoring';
import { useGame } from '../store';

const SPEED_LABELS: Record<number, string> = { 1: 'Walk', 10: 'Run', 50: 'Zoom' };

export function Controls() {
  const g = useGame();
  const { ai } = g;
  const robotSaved = ai.stats && g.baseline ? g.baseline.totalDist - ai.stats.totalDist : 0;
  return (
    <div className="controls">
      <div className="group">
        <button className="primary" onClick={g.togglePlay}>
          {g.playing ? 'Pause Pip' : g.live && !g.live.done ? 'Keep going' : 'Watch Pip pick'}
        </button>
        <div className="seg" role="group" aria-label="Speed">
          {([1, 10, 50] as const).map(n => (
            <button key={n} className={g.speed === n ? 'on' : ''} aria-pressed={g.speed === n} onClick={() => g.setSpeed(n)}>
              {SPEED_LABELS[n]}
            </button>
          ))}
        </div>
        <button className={g.heatmap ? 'on' : ''} aria-pressed={g.heatmap} onClick={g.toggleHeatmap}
          title="Colour shelves by how often Pip visits them while you watch">Busy shelves</button>
      </div>
      <div className="group">
        {g.mode === 'challenge' && !g.ended && g.swapsUsed > 0 && (
          <button className="done-btn" onClick={g.finish}>I'm done</button>
        )}
        <button onClick={g.reset}>Start over</button>
        {g.mode === 'sandbox' && <button onClick={g.loadBaseline}>Load starting shelves</button>}
      </div>
      <div className="group robot">
        <button className="robot-btn" onClick={g.runAI} disabled={ai.status === 'running'}>
          {ai.status === 'running' ? 'Robot is thinking…' : ai.status === 'done' ? 'Ask the robot again' : 'Ask the robot'}
        </button>
        {ai.status === 'running' && (
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ai.progress * 100)}>
            <div style={{ width: `${ai.progress * 100}%` }} />
          </div>
        )}
        {ai.status === 'done' && ai.stats && (
          <span className="robot-result">
            The robot tried {ai.it.toLocaleString()} swaps and scored <b>{pointsFor(robotSaved).toLocaleString()}</b>.
            You only get 10!
            {' '}<button className="link" onClick={g.loadAI}>See its shelves</button>
          </span>
        )}
      </div>
    </div>
  );
}
