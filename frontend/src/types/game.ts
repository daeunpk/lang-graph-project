export type GameCondition =
  | "leader_cooperative"
  | "leader_competitive"
  | "leader_coopetition"
  | "no_leader_cooperative"
  | "no_leader_competitive"
  | "no_leader_coopetition";

export type InteractionMode = "leader" | "free";
export type ScoringMode = "cooperative" | "competitive" | "coopetition";

export interface GameConfig {
  condition: GameCondition;
  interactionMode: InteractionMode;
  scoringMode: ScoringMode;
  sessionId: string;
  playerId: string;
  totalTurns: number;
  turnTimeLimit: number; // seconds
}

export interface ZoneState {
  zoneId: string;
  color: string;
  label: string;
  slots: (InstalledCard | null)[];
  maxSlots: number;
  nextExpected: number;
}

export interface InstalledCard {
  cardId: string;
  zoneId: string;
  slotIndex: number;
  number: number;
  isCorrect: boolean;
  installedBy: string;
  turnInstalled: number;
}

export interface BoardState {
  zones: ZoneState[];
  errorCount: number;
  maxErrors: number;
}

export interface PlayerState {
  playerId: string;
  name: string;
  isHuman: boolean;
  hp: number;
  maxHp: number;
  individualScore: number;
  handSize: number;
}

export interface GameState {
  sessionId: string;
  config: GameConfig;
  currentTurn: number;
  currentPhase: GamePhase;
  board: BoardState;
  players: PlayerState[];
  teamScore: number;
  teamScoreThreshold: number; // for coopetition
  thresholdReached: boolean;
  isGameOver: boolean;
  gameOverReason?: string;
  winner?: string;
  turnStartedAt?: string;
}

export type GamePhase =
  | "waiting"
  | "agent_reporting"
  | "human_turn"
  | "resolving"
  | "turn_end"
  | "game_over";