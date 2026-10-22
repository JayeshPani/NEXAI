// Start menu: a shipping box with a rubber-stamp title
import { useGame } from '../store';
import { HighScores } from './HighScores';
import { HowToPlay } from './HowToPlay';

export function Menu() {
  const { play, panel, setPanel, data } = useGame();
  return (
    <div className="menu-backdrop">
      <div className="box">
        <div className="box-flaps" aria-hidden="true" />
        {panel === null && (
          <div className="box-body">
            <h1 className="stamp">Pick &amp; Pack<br />Puzzle</h1>
            <p className="menu-intro">
              Pip fetches toys and gifts for real orders from a shop in November 2011.
              Move the shelves around so Pip walks less!
            </p>
            <div className="menu-actions">
              <button className="big primary" onClick={() => play('challenge')}>
                Play the puzzle
                <small>10 swaps · earn up to 3 stars</small>
              </button>
              <button className="big" onClick={() => play('sandbox')}>
                Free play
                <small>Start from jumbled shelves, swap as much as you like</small>
              </button>
              <div className="menu-row">
                <button onClick={() => setPanel('how')}>How to play</button>
                <button onClick={() => setPanel('scores')}>High scores</button>
              </div>
            </div>
            <p className="menu-foot">
              {data ? `${data.products.length} products · ${data.orders.test.length} real orders to score` : ''}
            </p>
          </div>
        )}
        {panel === 'how' && <HowToPlay onBack={() => setPanel(null)} />}
        {panel === 'scores' && <HighScores onBack={() => setPanel(null)} />}
      </div>
    </div>
  );
}
