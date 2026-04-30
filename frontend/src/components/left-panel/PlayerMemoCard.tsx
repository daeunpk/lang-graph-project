import { useState, useEffect } from "react";

export function PlayerMemoCard() {
  const [memo, setMemo] = useState(() => {
    return localStorage.getItem("playerMemo") ?? "";
  });

  useEffect(() => {
    localStorage.setItem("playerMemo", memo);
  }, [memo]);

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