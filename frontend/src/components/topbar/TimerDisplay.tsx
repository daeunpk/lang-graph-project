import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useTurnTimer } from "../../hooks/useTurnTimer";
import { formatTime } from "../../utils/format";
import { sendAction } from "../../utils/sendAction";

export function TimerDisplay() {
  const { gameState } = useGameStore();
  const sessionId = gameState?.sessionId ?? "";
  const playerId = localStorage.getItem("playerId") ?? "";
  const isHumanTurn = gameState?.currentPhase === "human_turn";

  const handleTimeout = async () => {
    if (!sessionId || !playerId) return;
    await sendAction(sessionId, playerId, "rest", {});
  };

  const { secondsLeft, urgency } = useTurnTimer(
    gameState?.config.turnTimeLimit ?? 60,
    isHumanTurn,
    handleTimeout
  );

  if (!isHumanTurn) return null;

  return (
    <div className={`timer-display urgency-${urgency}`}>
      <span className="timer-icon">⏱</span>
      <span className="timer-value">{formatTime(secondsLeft)}</span>
    </div>
  );
}