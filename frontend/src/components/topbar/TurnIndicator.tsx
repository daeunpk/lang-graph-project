import type { GamePhase } from "../../types/game";

const PHASE_LABELS: Record<GamePhase, string> = {
  waiting: "대기 중",
  agent_reporting: "에이전트 보고 중",
  human_turn: "당신의 턴",
  resolving: "처리 중",
  turn_end: "턴 종료",
  game_over: "게임 종료",
};

interface TurnIndicatorProps {
  currentTurn: number;
  totalTurns: number;
  phase: GamePhase;
}

export function TurnIndicator({ currentTurn, totalTurns, phase }: TurnIndicatorProps) {
  return (
    <div className="turn-indicator">
      <div className="turn-number">
        <span className="turn-label">TURN</span>
        <span className="turn-value">
          {currentTurn}
          <span className="turn-total">/{totalTurns}</span>
        </span>
      </div>
      <div className={`phase-badge phase-${phase}`}>{PHASE_LABELS[phase]}</div>
    </div>
  );
}