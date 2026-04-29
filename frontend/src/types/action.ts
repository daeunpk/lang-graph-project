export type ActionType =
  | "install"
  | "discard"
  | "rest"
  | "broadcast"
  | "followup"
  | "request_hint";

export interface BaseAction {
  actionId: string;
  actionType: ActionType;
  playerId: string;
  turn: number;
  timestamp: string;
}

export interface InstallAction extends BaseAction {
  actionType: "install";
  cardId: string;
  targetZone: string;
  targetSlot: number;
}

export interface DiscardAction extends BaseAction {
  actionType: "discard";
  cardId: string;
}

export interface RestAction extends BaseAction {
  actionType: "rest";
  hpRecovered: number;
}

export interface BroadcastAction extends BaseAction {
  actionType: "broadcast";
  message: string;
  targetAgentIds: string[] | "all";
}

export interface FollowupAction extends BaseAction {
  actionType: "followup";
  targetAgentId: string;
  question: string;
}

export type GameAction =
  | InstallAction
  | DiscardAction
  | RestAction
  | BroadcastAction
  | FollowupAction;

export interface ActionResult {
  success: boolean;
  actionType?: ActionType;
  message: string;
  hpDelta?: number;
  scoreDelta?: number;
  teamScoreDelta?: number;
  errorAdded?: boolean;
}