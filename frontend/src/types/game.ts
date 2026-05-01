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
  turnTimeLimit: number;
}

// [수정] 백엔드 GameEngine의 zones 구조에 맞게 slots 내부 타입 변경
export interface ZoneState {
  zoneId: string;
  slots: (InstalledCard | null)[]; // 백엔드에서 [None]*5로 초기화됨
  maxSlots: number;
  nextExpected: number;
}

export interface InstalledCard {
  cardId: string;
  number: number;
  isCorrect: boolean;
  // 백엔드에서 추가로 보내주는 정보가 있다면 여기에 정의
}

export interface BoardState {
  zones: ZoneState[];
  errorCount: number;
  maxErrors: number;
}

export interface DeckState {
  totalCards: number;
  remainingCards: number;
  discardedCards: number;
  inHandCards?: number;
  installedCards?: number;
}

// [수정] PlayerState에 hand 속성 추가
export interface PlayerState {
  playerId: string;
  name: string;
  isHuman: boolean;
  hp: number;
  maxHp: number;
  individualScore: number;
  handSize: number;
  // [핵심 추가] 이 부분이 있어야 gameStore에서 에러가 나지 않습니다.
  hand: CardData[]; 
}

// [추가] 개별 카드 데이터 인터페이스
export interface CardData {
  cardId: string;
  number: number | null; // 내 카드일 경우 필터링되어 null로 올 수 있음
  zone: any;
  truth: string;
  hintHistory?: Array<{
    turn: number;
    hintType: "number" | "zone" | "truth";
    value: string;
    givenBy: string;
    message?: string;
  }>;
}

export interface GameState {
  sessionId: string;
  config: GameConfig;
  currentTurn: number;
  currentPhase: GamePhase;
  currentActorId?: string;
  board: BoardState;
  deck?: DeckState;
  players: PlayerState[];
  teamScore: number;
  teamScoreThreshold: number;
  thresholdReached: boolean;
  completionTargetScore?: number;
  completionTargetNumber?: number;
  maxTeamScore?: number;
  targetReached?: boolean;
  perfectReached?: boolean;
  teamFlow?: {
    mode: "balanced" | "cautious" | "information" | "push" | "conserve";
    label: string;
    description: string;
    source?: string;
  };
  isGameOver: boolean;
  gameOverReason?: string;
  winner?: string;
  turnStartedAt?: string;
}

export type GamePhase =
  | "waiting"
  | "agent_reporting"
  | "agent_turn"
  | "human_turn" // 에이전트 행동이 끝난 후 이 페이즈로 전환됨
  | "resolving"
  | "turn_end"
  | "game_over";
