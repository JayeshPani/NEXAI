import { readScores } from '../leaderboard';
import { Stars } from './Stars';

export function HighScores({ onBack }: { onBack: () => void }) {
  const scores = readScores();
  return (
    <div className="box-body">
      <h2>High scores</h2>
      {scores.length === 0
        ? <p className="empty">No scores yet. Finish a challenge to set the first one.</p>
        : (
          <ol className="scores">
            {scores.map((s, i) => (
              <li key={`${s.at}-${i}`}>
                <span className="who">{s.name}</span>
                <Stars n={s.stars} small />
                <span className="pts">{s.points.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      <p className="note">Saved on this computer only.</p>
      <button className="primary" onClick={onBack}>Back</button>
    </div>
  );
}
