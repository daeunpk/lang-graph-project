import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore'; // [핵심] 이 줄이 있어야 오류가 사라집니다.
import './ChatInput.css';

export function ChatInput() {
  const [message, setMessage] = useState('');
  
  // 스토어에서 현재 인간의 턴인지 상태를 가져옵니다.
  const isHumanTurn = useGameStore((state) => state.isHumanTurn);

  const handleSend = () => {
    if (!message.trim() || !isHumanTurn) return;
    
    // 메시지 전송 로직 (추후 백엔드 연결)
    console.log("전송된 메시지:", message);
    setMessage('');
  };

  return (
    <div className={`chat-input-container ${!isHumanTurn ? 'locked' : ''}`}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        // 내 차례가 아니면 입력을 막습니다.
        disabled={!isHumanTurn}
        placeholder={isHumanTurn ? "메시지를 입력하세요..." : "동료의 차례를 기다리는 중입니다..."}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button 
        onClick={handleSend} 
        disabled={!isHumanTurn || !message.trim()}
      >
        전송
      </button>
    </div>
  );
}