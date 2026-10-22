// Game state (zustand). assign[productId] = slotId; "Yours" is always scored on the test week.
import { create } from 'zustand';
import type { GameData } from './data';
import { baselineLayout, originalLayout, productAt, samePickPoint } from './engine/layouts';
import { makeEngine, scoreLayout, type Stats } from './engine/sim';
import type { Order } from './engine/types';
import type { OptimizerMessage, OptimizerRequest } from './optimizer.worker';

export type Mode = 'challenge' | 'sandbox';
export type Screen = 'menu' | 'game';
export type Panel = 'how' | 'scores' | null;
export const MAX_SWAPS = 10;
export const REPLAY_ORDERS = 25;
export const SPEEDS = [1, 10, 50] as const;
const AI_BUDGET_MS = 5000;

type Engine = ReturnType<typeof makeEngine>;
type AI = {
  status: 'idle' | 'running' | 'done'; progress: number; it: number;
  assign?: number[]; stats?: Stats; trainGain?: number;
};
export type Live = { order: number; orderId: string; lines: number; dist: number; time: number; done: boolean };

type State = {
  data: GameData | null;
  screen: Screen; panel: Panel;
  mode: Mode;
  engine: Engine | null;
  assign: number[];          // copy of engine.assign for rendering
  at: number[];              // slot -> product
  original: Stats | null; baseline: Stats | null; yours: Stats | null;
  originalAssign: number[]; baselineAssign: number[];
  swapsUsed: number; ended: boolean;
  selected: number | null; hovered: number | null; preview: number | null;
  toast: { text: string; id: number } | null;
  feedback: { delta: number; id: number } | null;   // last swap, for the points pop-up
  playing: boolean; speed: number; replayId: number; sample: Order[];
  live: Live | null;
  heatmap: boolean; visits: number[];
  ai: AI;

  init: (data: GameData) => void;
  setMode: (m: Mode) => void;
  play: (m: Mode) => void;
  openMenu: () => void;
  setPanel: (p: Panel) => void;
  finish: () => void;
  reset: () => void;
  loadBaseline: () => void;
  loadAI: () => void;
  clickSlot: (s: number) => void;
  hoverSlot: (s: number | null) => void;
  togglePlay: () => void;
  restartReplay: () => void;
  setSpeed: (n: number) => void;
  setLive: (l: Live | null) => void;
  visit: (s: number) => void;
  toggleHeatmap: () => void;
  runAI: () => void;
  showToast: (text: string) => void;
};

let toastId = 0;
let worker: Worker | null = null;

export const useGame = create<State>((set, get) => {
  // Replace the whole layout (mode switch, reset, load baseline/AI)
  const loadLayout = (assign: number[], extra: Partial<State> = {}) => {
    const { data } = get();
    if (!data) return;
    const engine = makeEngine(data.orders.test, [...assign]);
    set({
      engine, assign: [...engine.assign], at: productAt(engine.assign), yours: engine.stats(),
      swapsUsed: 0, ended: false, selected: null, hovered: null, preview: null, feedback: null,
      visits: Array(100).fill(0), replayId: get().replayId + 1, live: null, ...extra,
    });
  };

  return {
    data: null, screen: 'menu', panel: null, feedback: null, mode: 'challenge', engine: null, assign: [], at: [],
    original: null, baseline: null, yours: null, originalAssign: [], baselineAssign: [],
    swapsUsed: 0, ended: false, selected: null, hovered: null, preview: null, toast: null,
    playing: false, speed: 10, replayId: 0, sample: [], live: null,
    heatmap: false, visits: Array(100).fill(0),
    ai: { status: 'idle', progress: 0, it: 0 },

    init: data => {
      const originalAssign = originalLayout(data.products);
      const baselineAssign = baselineLayout(data.products);
      const test = data.orders.test;
      // Replay sample: 25 orders spread evenly across the test week
      const sample = Array.from({ length: Math.min(REPLAY_ORDERS, test.length) },
        (_, i) => test[Math.floor((i * test.length) / Math.min(REPLAY_ORDERS, test.length))]);
      set({
        data, originalAssign, baselineAssign, sample,
        original: scoreLayout(test, originalAssign), baseline: scoreLayout(test, baselineAssign),
      });
      loadLayout(baselineAssign);
    },

    setMode: mode => {
      set({ mode });
      loadLayout(mode === 'challenge' ? get().baselineAssign : get().originalAssign);
    },
    play: mode => { set({ screen: 'game', panel: null, playing: false }); get().setMode(mode); },
    openMenu: () => set({ screen: 'menu', panel: null, playing: false, selected: null, preview: null }),
    setPanel: panel => set({ panel }),
    finish: () => set({ ended: true, selected: null, preview: null, playing: false }),
    reset: () => get().setMode(get().mode),
    loadBaseline: () => loadLayout(get().baselineAssign),
    loadAI: () => {
      const { ai } = get();
      if (ai.assign) loadLayout(ai.assign, { mode: 'sandbox' });
    },

    clickSlot: s => {
      const { selected, ended, engine, mode, swapsUsed, at } = get();
      if (ended || !engine) return;
      if (selected === null) return set({ selected: s, preview: null });
      if (s === selected) return set({ selected: null, preview: null });
      if (samePickPoint(selected, s)) {
        get().showToast('No change — same pick point');
        return set({ selected: null, preview: null });
      }
      if (mode === 'challenge' && swapsUsed >= MAX_SWAPS) return;
      const swap = engine.swapDelta(at[selected], at[s]);
      swap.commit();
      const used = swapsUsed + 1;
      set({
        feedback: { delta: swap.delta, id: ++toastId },
        assign: [...engine.assign], at: productAt(engine.assign), yours: engine.stats(),
        swapsUsed: used, selected: null, preview: null,
        ended: mode === 'challenge' && used >= MAX_SWAPS,
      });
      if (mode === 'challenge' && used >= MAX_SWAPS) set({ playing: false });
    },

    hoverSlot: s => {
      const { selected, engine, at } = get();
      let preview: number | null = null;
      // Δ preview: try the swap on the test-week engine, then undo
      if (s !== null && selected !== null && s !== selected && engine && !samePickPoint(selected, s)) {
        const trial = engine.swapDelta(at[selected], at[s]);
        preview = trial.delta;
        trial.undo();
      }
      set({ hovered: s, preview });
    },

    togglePlay: () => {
      const { playing, live } = get();
      if (!playing && live?.done) get().restartReplay();
      set({ playing: !playing });
    },
    restartReplay: () => set({ replayId: get().replayId + 1, live: null, visits: Array(100).fill(0), playing: true }),
    setSpeed: speed => set({ speed }),
    setLive: live => set({ live }),
    visit: s => {
      const visits = [...get().visits];
      visits[s]++;
      set({ visits });
    },
    toggleHeatmap: () => set({ heatmap: !get().heatmap }),

    runAI: () => {
      const { data, baselineAssign, ai } = get();
      if (!data || ai.status === 'running') return;
      worker?.terminate();
      worker = new Worker(new URL('./optimizer.worker.ts', import.meta.url), { type: 'module' });
      const trainBase = scoreLayout(data.orders.train, baselineAssign).totalDist;
      set({ ai: { status: 'running', progress: 0, it: 0 } });
      worker.onmessage = ({ data: msg }: MessageEvent<OptimizerMessage>) => {
        if (msg.type === 'progress')
          return set({ ai: { ...get().ai, progress: Math.min(1, msg.elapsed / AI_BUDGET_MS), it: msg.it } });
        // Score the returned layout on the test week with a fresh engine
        set({ ai: {
          status: 'done', progress: 1, it: msg.it, assign: msg.assign,
          stats: scoreLayout(data.orders.test, msg.assign), trainGain: msg.cur / trainBase - 1,
        } });
        worker?.terminate();
        worker = null;
      };
      worker.postMessage({
        assign: baselineAssign, train: data.orders.train, affinityPartners: data.partners, budgetMs: AI_BUDGET_MS,
      } satisfies OptimizerRequest);
    },

    showToast: text => {
      const id = ++toastId;
      set({ toast: { text, id } });
      setTimeout(() => get().toast?.id === id && set({ toast: null }), 2200);
    },
  };
});

// Dev-only handle for debugging in the browser console
if (import.meta.env.DEV) (globalThis as { game?: typeof useGame }).game = useGame;

// Points: metres saved vs the starting layout of the current mode (Starting shelves in the puzzle,
// Jumbled shelves in free play)
export function useSaved() {
  return useGame(s => {
    const start = s.mode === 'challenge' ? s.baseline : s.original;
    return start && s.yours ? start.totalDist - s.yours.totalDist : 0;
  });
}
