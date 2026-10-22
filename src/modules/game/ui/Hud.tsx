// Game header: points and swaps left, inside the shared module header
import { ModuleHeader } from '../../../core/ui/ModuleHeader';
import { MAX_SWAPS, useGame, useSaved } from '../gameStore';
import { pointsFor } from '../scoring';

export function GameHeader() {
  const { mode, swapsUsed, view } = useGame();
  const points = pointsFor(useSaved());
  const subtitle = view === 'menu' ? 'Re-slot the shelves so orders are faster to pick'
    : mode === 'challenge' ? 'Challenge: beat the baseline in 10 swaps' : 'Sandbox: started from the as-received layout';
  return (
    <ModuleHeader n={3} title="Slotting challenge" subtitle={subtitle}>
      {view === 'play' && (<>
        <div className={`points ${points > 0 ? 'up' : points < 0 ? 'down' : ''}`} aria-live="polite">
          <b>{points.toLocaleString()}</b> pts
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
