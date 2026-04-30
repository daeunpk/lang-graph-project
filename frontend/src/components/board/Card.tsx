import React from 'react';
import { useGameStore } from '../../store/gameStore'; // [추가] 스토어 연결
import './Card.css';

interface CardProps {
  card: {
    cardId: string; // [추가] 선택을 위해 ID 필요
    number: number | null;
    color: string | null;
  };
  isMine: boolean;
  onSelect?: (cardId: string) => void; // [추가] 클릭 핸들러
}

export function Card({ card, isMine, onSelect }: CardProps) {
  // [추가] 현재 인간 턴인지 확인
  const isHumanTurn = useGameStore((state) => state.isHumanTurn);
  const isFaceDown = isMine && card.number === null;
  
  // [추가] 내 카드인데 내 턴이 아니면 클릭 막기
  const isDisabled = isMine && !isHumanTurn;

  const handleClick = () => {
    if (isDisabled) return; // 클릭 방지
    if (onSelect) onSelect(card.cardId);
  };

  return (
    <div 
      className={`game-card ${isFaceDown ? 'back' : card.color} ${isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      {isFaceDown ? (
        <div className="card-inner">?</div>
      ) : (
        <div className="card-inner">
          <span className="card-number">{card.number}</span>
        </div>
      )}
    </div>
  );
}