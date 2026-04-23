import type { GameState, GamePhase, InteractionMode } from "../types/game";

export interface PlayerPermissions {
  canInstall: boolean;
  canDiscard: boolean;
  canRest: boolean;
  canBroadcast: boolean;
  canFollowup: boolean;
  canSelectCard: boolean;
  canChat: boolean;
  isHumanTurn: boolean;
}

export function getPlayerPermissions(
  state: GameState | null,
  playerId: string
): PlayerPermissions {
  if (!state) {
    return {
      canInstall: false,
      canDiscard: false,
      canRest: false,
      canBroadcast: false,
      canFollowup: false,
      canSelectCard: false,
      canChat: false,
      isHumanTurn: false,
    };
  }

  const phase: GamePhase = state.currentPhase;
  const mode: InteractionMode = state.config.interactionMode;
  const isHumanTurn = phase === "human_turn";

  const canInstall = isHumanTurn;
  const canDiscard = isHumanTurn;
  const canRest = isHumanTurn;
  const canBroadcast = isHumanTurn && mode === "leader";
  const canFollowup = isHumanTurn && mode === "leader";
  const canSelectCard = isHumanTurn;
  const canChat = mode === "free" && phase !== "game_over";

  return {
    canInstall,
    canDiscard,
    canRest,
    canBroadcast,
    canFollowup,
    canSelectCard,
    canChat,
    isHumanTurn,
  };
}