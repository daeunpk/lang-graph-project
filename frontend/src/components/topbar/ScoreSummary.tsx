import { useGameStore } from "../../store/gameStore";
import { computeScoreBreakdown } from "../../utils/score";

export function ScoreSummary() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const playerId = localStorage.getItem("playerId") ?? "";
  const breakdown = computeScoreBreakdown(gameState, playerId);

  return (
    <div className="score-summary">
      <div className="score-item">
        <span className="score-label">팀</span>
        <span className="score-value team">{breakdown.teamScore}/25</span>
      </div>
      <div className="score-divider" />
      <div className="score-item">
        <span className="score-label">성공</span>
        <span className="score-value">{breakdown.individualScore}</span>
      </div>
      {gameState.config.scoringMode === "coopetition" && (
        <>
          <div className="score-divider" />
          <div
            className={`threshold-indicator ${
              gameState.thresholdReached ? "reached" : "pending"
            }`}
          >
            {gameState.thresholdReached ? "▲ 기준선 달성" : `목표: ${gameState.teamScoreThreshold}`}
          </div>
        </>
      )}
    </div>
  );
}
