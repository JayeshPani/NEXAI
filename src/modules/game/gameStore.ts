// Module 3 — Slotting game state. assign[productId] = slotId; "Yours" is always scored on the test week.
import { create } from 'zustand';
import type { GameData } from '../../core/data';
import { productAt, samePickPoint } from '../../core/engine/layouts';
import { makeEngine, scoreLayout, type Stats } from '../../core/engine/sim';
import { useReplay } from '../twin/replayStore';
import type { OptimizerMessage, OptimizerRequest } from './optimizer.worker';

export type Mode = 'challenge' | 'sandbox';
export type View = 'menu' | 'play';
export type Panel = 'how' | 'scores' | null;
export const MAX_SWAPS = 10;
const AI_BUDGET_MS = 5000;

type Engine = ReturnType<typeof makeEngine>;
type AI = {
  status: 'idle' | 'running' | 'done'; progress: number; it: number;
  assign?: number[]; stats?: Stats; trainGain?: number;
};

type State = {
  data: GameData | null;
  view: View; panel: Panel; mode: Mode;
  engine: Engine | null;
  assign: number[];          // copy of engine.assign for rendering
  at: number[];              // slot -> product
  original: Stats | null; baseline: Stats | null; yours: Stats | null;
  swapsUsed: number; ended: boolean;
  selected: number | null; hovered: number | null; preview: number | null;
  toast: { text: string; id: number } | null;
  feedback: { delta: number; id: number } | null;   // last swap, for the points pop-up
  ai: AI;

  init: (data: GameData) => void;
  play: (m: Mode) => void;
  openMenu: () => void;
  setPanel: (p: Panel) => void;
  setMode: (m: Mode) => void;
  reset: () => void;
  finish: () => void;
  loadBaseline: () => void;
  loadAI: () => void;
  clickSlot: (s: number) => void;
  hoverSlot: (s: number | null) => void;
  deselect: () => void;
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
      swapsUsed: 0, ended: false, selected: null, hovered: null, preview: null, feedback: null, ...extra,
    });
    useReplay.getState().reset();
  };

  return {
    data: null, view: 'menu', panel: null, mode: 'challenge', engine: null, assign: [], at: [],
    original: null, baseline: null, yours: null,
    swapsUsed: 0, ended: false, selected: null, hovered: null, preview: null, toast: null, feedback: null,
    ai: { status: 'idle', progress: 0, it: 0 },

    init: data => {
      if (get().data === data) return;
      set({
        data,
        original: scoreLayout(data.orders.test, data.originalAssign),
        baseline: scoreLayout(data.orders.test, data.baselineAssign),
      });
      loadLayout(data.baselineAssign);
    },

    play: mode => { set({ view: 'play', panel: null }); get().setMode(mode); },
    openMenu: () => { set({ view: 'menu', panel: null, selected: null, preview: null }); useReplay.getState().reset(); },
    setPanel: panel => set({ panel }),
    setMode: mode => {
      const { data } = get();
      if (!data) return;
      set({ mode });
      loadLayout(mode === 'challenge' ? data.baselineAssign : data.originalAssign);
    },
    reset: () => get().setMode(get().mode),
    finish: () => { set({ ended: true, selected: null, preview: null }); useReplay.setState({ playing: false }); },
    loadBaseline: () => { const { data } = get(); if (data) loadLayout(data.baselineAssign); },
    loadAI: () => { const { ai } = get(); if (ai.assign) loadLayout(ai.assign, { mode: 'sandbox' }); },

    clickSlot: s => {
      const { selected, ended, engine, mode, swapsUsed, at } = get();
      if (ended || !engine) return;
      if (selected === null) return set({ selected: s, preview: null });
      if (s === selected) return set({ selected: null, preview: null });
      if (samePickPoint(selected, s)) {
        get().showToast('Same spot for Pip, no change. That swap was free.');
        return set({ selected: null, preview: null });
      }
      if (mode === 'challenge' && swapsUsed >= MAX_SWAPS) return;
      const swap = engine.swapDelta(at[selected], at[s]);
      swap.commit();
      const used = swapsUsed + 1;
      const over = mode === 'challenge' && used >= MAX_SWAPS;
      set({
        feedback: { delta: swap.delta, id: ++toastId },
        assign: [...engine.assign], at: productAt(engine.assign), yours: engine.stats(),
        swapsUsed: used, selected: null, preview: null, ended: over,
      });
      if (over) useReplay.setState({ playing: false });
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
    deselect: () => set({ selected: null, preview: null }),

    runAI: () => {
      const { data, ai } = get();
      if (!data || ai.status === 'running') return;
      worker?.terminate();
      worker = new Worker(new URL('./optimizer.worker.ts', import.meta.url), { type: 'module' });
      const trainBase = scoreLayout(data.orders.train, data.baselineAssign).totalDist;
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
        assign: data.baselineAssign, train: data.orders.train, affinityPartners: data.partners, budgetMs: AI_BUDGET_MS,
      } satisfies OptimizerRequest);
    },

    showToast: text => {
      const id = ++toastId;
      set({ toast: { text, id } });
      setTimeout(() => get().toast?.id === id && set({ toast: null }), 2200);
    },
  };
});

// Points: metres saved vs the starting layout of the current mode (Starting shelves in the puzzle,
// Jumbled shelves in free play)
export function useSaved() {
  return useGame(s => {
    const start = s.mode === 'challenge' ? s.baseline : s.original;
    return start && s.yours ? start.totalDist - s.yours.totalDist : 0;
  });
}

// Dev-only handle for debugging in the browser console
if (import.meta.env.DEV) (globalThis as { game?: typeof useGame }).game = useGame;
