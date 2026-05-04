import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, BoardState } from "../types/game";
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
  isHumanTurn: boolean;
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
  isHumanTurn: false,
};

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  immer((set) => ({
    ...initialState,

    setGameState: (state) =>
      set((s) => {
        s.gameState = state;
        s.isHumanTurn = state.currentPhase === "human_turn";
        if (!s.isHumanTurn) {
          s.selectedCardId = null;
        }
        
        const myData = state.players.find(p => p.playerId === state.config.playerId);
        
        if (myData && myData.hand) {
          s.myHand = myData.hand.map((c: any) => ({
            cardId: c.cardId,
            number: c.number, // 내 카드는 번호만 앎
            zone: c.zone,
            truth: c.truth,
            isSelected: s.selectedCardId === c.cardId,
            isPlayable: s.isHumanTurn,
            knownNumber: c.number,
            knownZone:
              c.zone !== "unknown"
                ? c.zone
                : [...(c.hintHistory ?? [])]
                    .reverse()
                    .find((h: any) => h.hintType === "zone")?.value ?? null,
            knownTruth:
              c.truth !== "unknown"
                ? c.truth
                : [...(c.hintHistory ?? [])]
                    .reverse()
                    .find((h: any) => h.hintType === "truth")?.value ?? null,
            hintHistory: c.hintHistory ?? [],
          } as HandCard));
        }
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
