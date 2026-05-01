import { TurnIndicator } from "./TurnIndicator";
import { TimerDisplay } from "./TimerDisplay";
import { ScoreSummary } from "./ScoreSummary";
import { useGameStore } from "../../store/gameStore";

export function TopStatusBar() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const { board, players } = gameState;
  const human = players.find((p) => p.isHuman);
  const actor = players.find((p) => p.playerId === gameState.currentActorId);
  const errorSeverity =
    board.errorCount / board.maxErrors < 0.4
      ? "safe"
      : board.errorCount / board.maxErrors < 0.75
      ? "caution"
      : "danger";

  return (
    <div className="top-status-bar">
      <TurnIndicator
        currentTurn={gameState.currentTurn}
        totalTurns={gameState.config.totalTurns}
        phase={gameState.currentPhase}
        actorName={actor?.isHuman ? "나" : actor?.name}
      />

      <div className="top-center-cluster">
        <div className="hp-display">
          <span className="hp-label">HP</span>
          <div className="hp-bar-container">
            <div
              className="hp-bar-fill"
              style={{
                width: `${((human?.hp ?? 0) / (human?.maxHp ?? 1)) * 100}%`,
                backgroundColor:
                  (human?.hp ?? 0) / (human?.maxHp ?? 1) > 0.6
                    ? "#4ade80"
                    : (human?.hp ?? 0) / (human?.maxHp ?? 1) > 0.3
                    ? "#facc15"
                    : "#f87171",
              }}
            />
          </div>
          <span className="hp-value">
            {human?.hp ?? 0}/{human?.maxHp ?? 0}
          </span>
        </div>

        <div className={`error-display ${errorSeverity}`}>
          <span className="error-label">오류</span>
          <span className="error-value">
            {board.errorCount}/{board.maxErrors}
          </span>
        </div>
      </div>

      <div className="top-right-cluster">
        <TimerDisplay />
        <ScoreSummary />
      </div>
    </div>
  );
}
