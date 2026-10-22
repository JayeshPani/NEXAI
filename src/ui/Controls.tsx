// Controls (Section 6.4): Replay, Reset, Load baseline, Mode, Speed, Heatmap, AI Suggest
import { SPEEDS, useGame } from '../store';
import { pct } from './format';

export function Controls() {
  const g = useGame();
  const { ai } = g;
  return (
    <div className="panel controls">
      <div className="group">
        <button className="primary" onClick={g.togglePlay}>{g.playing ? 'Pause' : g.live?.done || !g.live ? 'Replay' : 'Resume'}</button>
        <div className="seg" role="group" aria-label="Speed">
          {SPEEDS.map(n => (
            <button key={n} className={g.speed === n ? 'on' : ''} onClick={() => g.setSpeed(n)}>{n}×</button>
          ))}
        </div>
        <button className={g.heatmap ? 'on' : ''} onClick={g.toggleHeatmap} title="Recolour racks by visits during the replay">Heatmap</button>
      </div>
      <div className="group">
        <div className="seg" role="group" aria-label="Mode">
          <button className={g.mode === 'challenge' ? 'on' : ''} onClick={() => g.setMode('challenge')}>Challenge</button>
          <button className={g.mode === 'sandbox' ? 'on' : ''} onClick={() => g.setMode('sandbox')}>Sandbox</button>
        </div>
        <button onClick={g.reset}>Reset</button>
        <button onClick={g.loadBaseline}>Load baseline</button>
      </div>
      <div className="group ai-group">
        <button className="ai-btn" onClick={g.runAI} disabled={ai.status === 'running'}>
          {ai.status === 'running' ? 'Optimising…' : ai.status === 'done' ? 'Run AI Suggest again' : 'AI Suggest'}
        </button>
        {ai.status === 'running' && (
          <div className="progress" aria-label="AI progress"><div style={{ width: `${ai.progress * 100}%` }} /></div>
        )}
        {ai.status === 'done' && ai.stats && g.baseline && (
          <>
            <span className="ai-result">
              {pct(ai.stats.totalDist / g.baseline.totalDist - 1)} vs Baseline on the unseen test week
              <small> (train: {pct(ai.trainGain!)} · {ai.it.toLocaleString()} swaps tried)</small>
            </span>
            <button onClick={g.loadAI} title="Opens the AI layout in Sandbox mode">View AI layout</button>
          </>
        )}
      </div>
    </div>
  );
}
