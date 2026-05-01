import { useState, useEffect } from "react";
import { useGameStore } from "../../store/gameStore";

export function PlayerMemoCard() {
  const sessionId = useGameStore((s) => s.gameState?.sessionId ?? "no-session");
  const storageKey = `playerMemo:${sessionId}`;
  const [memo, setMemo] = useState(() => {
    return localStorage.getItem(storageKey) ?? "";
  });

  useEffect(() => {
    setMemo(localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, memo);
  }, [memo, storageKey]);

  return (
    <div className="player-memo-card">
      <h3 className="memo-title">개인 메모</h3>
      <p className="memo-hint">에이전트 보고나 카드 힌트를 기록하세요.</p>
      <textarea
        className="memo-textarea"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="자유롭게 메모하세요..."
        rows={12}
      />
    </div>
  );
}
