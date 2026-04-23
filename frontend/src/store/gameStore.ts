import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, GameConfig, BoardState } from "../types/game";
import type { HandCard } from "../types/card";
import type { ActionResult } from "../types/action";
import type { LogEntry } from "../types/log";

interface GameStoreState {
  gameState: GameState | null;
  myHand: HandCard[];
  selectedCardId: string | null;
  actionResult: ActionResult | null;
  logs: LogEntry[];
  isLoading: boolean;
  error: string | null;
}

interface GameStoreActions {
  setGameState: (state: GameState) => void;
  setMyHand: (hand: HandCard[]) => void;
  selectCard: (cardId: string | null) => void;
  setActionResult: (result: ActionResult | null) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBoard: (board: BoardState) => void;
  reset: () => void;
}

const initialState: GameStoreState = {
  gameState: null,
  myHand: [],
  selectedCardId: null,
  actionResult: null,
  logs: [],
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  immer((set) => ({
    ...initialState,

    setGameState: (state) =>
      set((s) => {
        s.gameState = state;
      }),

    setMyHand: (hand) =>
      set((s) => {
        s.myHand = hand;
      }),

    selectCard: (cardId) =>
      set((s) => {
        s.selectedCardId = cardId;
        s.myHand = s.myHand.map((c) => ({
          ...c,
          isSelected: c.cardId === cardId,
        }));
      }),

    setActionResult: (result) =>
      set((s) => {
        s.actionResult = result;
      }),

    addLog: (log) =>
      set((s) => {
        s.logs.unshift(log);
        if (s.logs.length > 200) s.logs = s.logs.slice(0, 200);
      }),

    clearLogs: () =>
      set((s) => {
        s.logs = [];
      }),

    setLoading: (loading) =>
      set((s) => {
        s.isLoading = loading;
      }),

    setError: (error) =>
      set((s) => {
        s.error = error;
      }),

    updateBoard: (board) =>
      set((s) => {
        if (s.gameState) {
          s.gameState.board = board;
        }
      }),

    reset: () => set(() => ({ ...initialState })),
  }))
);