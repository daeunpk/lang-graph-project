// frontend/src/components/board/Card.tsx
import React from 'react';
import './Card.css'; // 별도 스타일링 필요

interface CardProps {
  card: {
    number: number | null;
    color: string | null;
  };
  isMine: boolean;
}

export function Card({ card, isMine }: CardProps) {
  // 내 카드인데 정보가 null이면 '뒷면' 표시
  const isFaceDown = isMine && card.number === null;

  return (
    <div className={`game-card ${isFaceDown ? 'back' : card.color}`}>
      {isFaceDown ? (
        <div className="card-inner">?</div> // 뒷면 디자인
      ) : (
        <div className="card-inner">
          <span className="card-number">{card.number}</span>
        </div>
      )}
    </div>
  );
}