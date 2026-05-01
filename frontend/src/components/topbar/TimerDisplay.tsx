import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { formatTime } from "../../utils/format";
import { sendAction } from "../../utils/sendAction";

export function TimerDisplay() {
  const { gameState } = useGameStore();
  const sessionId = gameState?.sessionId ?? "";
  const playerId = localStorage.getItem("playerId") ?? "";
  const isHumanTurn = gameState?.currentPhase === "human_turn";
  const currentActor = gameState?.players.find(
    (p) => p.playerId === gameState.currentActorId
  );
  const timeLimit = gameState?.config.turnTimeLimit ?? 20;
  const startedAt = gameState?.turnStartedAt;
  const timeoutKey = `${gameState?.currentTurn ?? 0}-${gameState?.currentPhase ?? "none"}-${startedAt ?? ""}`;
  const timeoutRef = useRef<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const startMs = new Date(startedAt).getTime();
    if (Number.isNaN(startMs)) return 0;
    return Math.max(0, (now - startMs) / 1000);
  }, [now, startedAt]);

  const secondsLeft = Math.max(0, Math.ceil(timeLimit - elapsedSeconds));
  const progress = Math.max(0, Math.min(1, secondsLeft / timeLimit));
  const urgency =
    secondsLeft <= 5 ? "critical" : secondsLeft <= 10 ? "warning" : "normal";

  useEffect(() => {
    if (!isHumanTurn || !sessionId || !playerId || secondsLeft > 0) return;
    if (timeoutRef.current === timeoutKey) return;

    timeoutRef.current = timeoutKey;
    void sendAction(sessionId, playerId, "timeout", {});
  }, [isHumanTurn, playerId, secondsLeft, sessionId, timeoutKey]);

  if (!gameState) return null;

  return (
    <div className={`timer-display urgency-${urgency}`}>
      <div className="timer-meta">
        <span className="timer-label">
          {isHumanTurn
            ? "내 행동 시간"
            : `${currentActor?.name ?? "에이전트"} 턴`}
        </span>
        <span className="timer-value">{formatTime(secondsLeft)}</span>
      </div>
      <div className="timer-track">
        <div
          className="timer-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
