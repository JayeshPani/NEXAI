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

export const useApp = create<AppState>((set, get) => ({
  data: null, error: null, screen: 'home',
  load: async () => {
    if (get().data) return;
    try { set({ data: await loadData() }); } catch (e) { set({ error: e instanceof Error ? e.message : String(e) }); }
  },
  go: screen => set({ screen }),
}));

/** Use inside modules, which only render once data has loaded. */
export const useData = () => useApp(s => s.data)!;
