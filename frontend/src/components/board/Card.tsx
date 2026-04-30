import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './Card.css';

interface CardProps {
  card: any;
  isMine: boolean;
  onSelect?: (cardId: string) => void;
}

export function Card({ card, isMine, onSelect }: CardProps) {
  const isHumanTurn = useGameStore((state) => state.isHumanTurn);
  
  // 내 카드: 번호 노출, 색상/진위는 unknown 처리 (흑백)
  // 타인 카드: 번호 숨김, 색상/진위(T/F) 노출
  const isFaceDownForMe = isMine; 
  const isDisabled = isMine && !isHumanTurn;

  return (
    <div 
      className={`game-card ${isMine ? 'mine' : card.zone} ${isDisabled ? 'disabled' : ''}`}
      onClick={() => !isDisabled && onSelect?.(card.cardId)}
    >
      <div className="card-inner">
        {isMine ? (
          <span className="card-number">{card.number}</span>
        ) : (
          <>
            <span className="card-truth">{card.truth === 'genuine' ? 'T' : 'F'}</span>
            <span className="card-back-hint">?</span>
          </>
        )}
      </div>
    </div>
  );
}