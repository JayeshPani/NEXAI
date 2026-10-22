// Game header: points and swaps left, inside the shared module header
import { ModuleHeader } from '../../../core/ui/ModuleHeader';
import { MAX_SWAPS, useGame, useSaved } from '../gameStore';
import { pointsFor } from '../scoring';

export function GameHeader() {
  const { mode, swapsUsed, view } = useGame();
  const points = pointsFor(useSaved());
  const subtitle = view === 'menu' ? 'Re-arrange the shelves so Pip walks less'
    : mode === 'challenge' ? 'Puzzle: beat the starting shelves in 10 swaps' : 'Free play: started from jumbled shelves';
  return (
    <ModuleHeader n={3} title="Slotting game" subtitle={subtitle}>
      {view === 'play' && (<>
        <div className={`points ${points > 0 ? 'up' : points < 0 ? 'down' : ''}`} aria-live="polite">
          <b>{points.toLocaleString()}</b> points
        </div>
        {mode === 'challenge' && (
          <div className="swaps" aria-label={`${MAX_SWAPS - swapsUsed} swaps left`}>
            {Array.from({ length: MAX_SWAPS }, (_, i) => <i key={i} className={i < swapsUsed ? 'used' : ''} />)}
          </div>
        )}
      </>)}
    </ModuleHeader>
  );
}
