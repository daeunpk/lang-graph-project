import { useGameStore } from "../../store/gameStore";
import { computeScoreBreakdown } from "../../utils/score";

export function ScoreSummary() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const playerId = localStorage.getItem("playerId") ?? "";
  const breakdown = computeScoreBreakdown(gameState, playerId);
  const maxScore = gameState.maxTeamScore ?? 25;
  const targetScore = gameState.completionTargetScore ?? gameState.teamScoreThreshold;

  return (
    <div className="score-summary">
      <div className="score-item">
        <span className="score-label">팀</span>
        <span className="score-value team">{breakdown.teamScore}/{maxScore}</span>
      </div>
      <div className="score-divider" />
      <div className="score-item">
        <span className="score-label">성공</span>
        <span className="score-value">{breakdown.individualScore}</span>
      </div>
      <div className="score-divider" />
      <div
        className={`threshold-indicator ${
          (gameState.targetReached ?? gameState.thresholdReached) ? "reached" : "pending"
        }`}
      >
        {(gameState.targetReached ?? gameState.thresholdReached)
          ? "기본 완성"
          : `목표: ${targetScore}`}
      </div>
    </div>
  );
}
