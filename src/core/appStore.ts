// Core: loaded data and which module is open. Modules never import each other's state except
// the game, which reuses the twin's replay.
import { create } from 'zustand';
import { loadData, type GameData } from './data';

export type Screen = 'home' | 'data' | 'twin' | 'game';

type AppState = {
  data: GameData | null; error: string | null; screen: Screen;
  load: () => Promise<void>;
  go: (screen: Screen) => void;
};

let pending: Promise<void> | null = null;   // load once, even if React runs the effect twice

export const useApp = create<AppState>((set, get) => ({
  data: null, error: null, screen: 'home',
  load: () => {
    if (get().data) return Promise.resolve();
    pending ??= loadData()
      .then(data => set({ data }))
      .catch(e => { pending = null; set({ error: e instanceof Error ? e.message : String(e) }); });
    return pending;
  },
  go: screen => set({ screen }),
}));

/** Use inside modules, which only render once data has loaded. */
export const useData = () => useApp(s => s.data)!;
