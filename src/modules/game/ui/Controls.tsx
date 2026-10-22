// Game controls: replay (from the twin module), finish, reset, and AI Suggest
import { AisleFocus } from '../../twin/ui/AisleFocus';
import { ColourBySwitch } from '../../twin/ui/ColourBy';
import { ReplayControls } from '../../twin/ui/ReplayControls';
import { useGame } from '../gameStore';
import { pointsFor } from '../scoring';

export function Controls() {
  const g = useGame();
  const { ai } = g;
  const aiSaved = ai.stats && g.baseline ? g.baseline.totalTime - ai.stats.totalTime : 0;   // seconds, like the player's score
  return (
    <div className="controls">
      <ReplayControls />
      <ColourBySwitch />
      <AisleFocus />
      <div className="group">
        {g.mode === 'challenge' && !g.ended && g.swapsUsed > 0 && (
          <button className="done-btn" onClick={g.finish}>Finish</button>
        )}
        <button onClick={g.reset}>Reset</button>
        <button onClick={g.openMenu}>Menu</button>
        {g.mode === 'sandbox' && <button onClick={g.loadBaseline}>Load baseline</button>}
      </div>
      <div className="group ai-group">
        <button className="ai-btn" onClick={g.runAI} disabled={ai.status === 'running'}>
          {ai.status === 'running' ? 'Optimising…' : ai.status === 'done' ? 'Run AI Suggest again' : 'Run AI Suggest'}
        </button>
        {ai.status === 'running' && (
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ai.progress * 100)}>
            <div style={{ width: `${ai.progress * 100}%` }} />
          </div>
        )}
        {ai.status === 'done' && ai.stats && (
          <span className="ai-result">
            AI Suggest: <b>{pointsFor(aiSaved).toLocaleString()} pts</b> after {ai.it.toLocaleString()} swaps
            (learned on 1–21 Nov, scored on 22–30 Nov).
            {' '}<button className="link" onClick={g.loadAI}>Open its layout</button>
          </span>
        )}
      </div>
    </div>
  );
}
