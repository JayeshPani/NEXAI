// Play/pause, speed and heatmap for Pip's replay (used by the twin and the game)
import { SPEEDS, useReplay } from '../replayStore';

const SPEED_LABELS: Record<number, string> = { 1: 'Walk', 10: 'Run', 50: 'Zoom' };

export function ReplayControls() {
  const r = useReplay();
  return (
    <div className="group">
      <button className="primary" onClick={r.togglePlay}>
        {r.playing ? 'Pause Pip' : r.live && !r.live.done ? 'Keep going' : r.live?.done ? 'Watch again' : 'Watch Pip pick'}
      </button>
      <div className="seg" role="group" aria-label="Speed">
        {SPEEDS.map(n => (
          <button key={n} className={r.speed === n ? 'on' : ''} aria-pressed={r.speed === n} onClick={() => r.setSpeed(n)}>
            {SPEED_LABELS[n]} {n}×
          </button>
        ))}
      </div>
      <button className={r.heatmap ? 'on' : ''} aria-pressed={r.heatmap} onClick={r.toggleHeatmap}
        title="Colour shelves by how often Pip visits them during the replay">Busy shelves</button>
    </div>
  );
}
