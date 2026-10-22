// Game controls: replay (from the twin module), finish, start over, and ask the robot (AI Suggest)
import { ReplayControls } from '../../twin/ui/ReplayControls';
import { useGame } from '../gameStore';
import { pointsFor } from '../scoring';

export function Controls() {
  const g = useGame();
  const { ai } = g;
  const robotSaved = ai.stats && g.baseline ? g.baseline.totalDist - ai.stats.totalDist : 0;
  return (
    <div className="controls">
      <ReplayControls />
      <div className="group">
        {g.mode === 'challenge' && !g.ended && g.swapsUsed > 0 && (
          <button className="done-btn" onClick={g.finish}>I'm done</button>
        )}
        <button onClick={g.reset}>Start over</button>
        <button onClick={g.openMenu}>Game menu</button>
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
