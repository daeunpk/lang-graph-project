import React, { useState, useRef, useEffect } from "react";
import { useAgentStore } from "../../store/agentStore";
import { useGameStore } from "../../store/gameStore";
import { sendAction } from "../../utils/sendAction";
import { formatTimestamp } from "../../utils/format";
import { getPlayerPermissions } from "../../utils/permissions";

interface LeaderCommunicationPanelProps {
  sessionId: string;
  isFreeMode?: boolean;
}

export function LeaderCommunicationPanel({
  sessionId,
  isFreeMode = false,
}: LeaderCommunicationPanelProps) {
  const { messages, agents } = useAgentStore();
  const { gameState } = useGameStore();
  const [input, setInput] = useState("");
  const [targetAgentId, setTargetAgentId] = useState<string | "all">("all");
  const listRef = useRef<HTMLDivElement>(null);

  const playerId = localStorage.getItem("playerId") ?? "";
  const perms = getPlayerPermissions(gameState, playerId);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!perms.canChat && !perms.canBroadcast) return;
    await sendAction(sessionId, playerId, isFreeMode ? "broadcast" : "broadcast", {
      message: input.trim(),
      targetAgentIds: targetAgentId === "all" ? "all" : [targetAgentId],
    });
    setInput("");
  };

  return (
    <div className="communication-panel">
      <div className="comm-header">
        <span className="comm-title">
          {isFreeMode ? "자유 대화" : "지시 채널"}
        </span>
      </div>

      <div className="comm-messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="comm-empty">대화 내역이 없습니다.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className={`comm-message ${msg.agentId === playerId ? "mine" : "theirs"}`}
          >
            <span className="msg-sender">{msg.agentName}</span>
            <p className="msg-content">{msg.content}</p>
            <span className="msg-time">{formatTimestamp(msg.timestamp)}</span>
          </div>
        ))}
      </div>

      <div className="comm-input-row">
        {isFreeMode && (
          <select
            className="comm-target-select"
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
          >
            <option value="all">전체</option>
            {agents.map((a) => (
              <option key={a.agentId} value={a.agentId}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <input
          className="comm-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지 입력..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="comm-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          →
        </button>
      </div>
    </div>
  );
}