import React from "react";
import { HandCard } from "./HandCard";
import { useGameStore } from "../../store/gameStore";

interface MyHandSectionProps {
  sessionId: string;
}

export function MyHandSection({ sessionId }: MyHandSectionProps) {
  const { myHand, gameState } = useGameStore();
  const isHumanTurn = gameState?.currentPhase === "human_turn";

  return (
    <div className="my-hand-section">
      <div className="hand-header">
        <span className="hand-title">내 손패</span>
        <span className="hand-count">{myHand.length}장</span>
      </div>
      <div className={`hand-cards ${isHumanTurn ? "active" : "inactive"}`}>
        {myHand.length === 0 && (
          <p className="hand-empty">손패가 없습니다.</p>
        )}
        {myHand.map((card) => (
          <HandCard key={card.cardId} card={card} sessionId={sessionId} />
        ))}
      </div>
      {!isHumanTurn && (
        <div className="hand-inactive-overlay">에이전트 보고 대기 중...</div>
      )}
    </div>
  );
}