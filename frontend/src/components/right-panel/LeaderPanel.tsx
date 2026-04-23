import React, { useState } from "react";
import { AgentReportStack } from "./AgentReportStack";
import { useUIStore } from "../../store/uiStore";
import { useGameStore } from "../../store/gameStore";
import { sendAction } from "../../utils/sendAction";
import { getPlayerPermissions } from "../../utils/permissions";

interface LeaderPanelProps {
  sessionId: string;
}

export function LeaderPanel({ sessionId }: LeaderPanelProps) {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const { isBroadcastPanelOpen, toggleBroadcastPanel, showNotification } = useUIStore();
  const { gameState } = useGameStore();
  const playerId = localStorage.getItem("playerId") ?? "";
  const perms = getPlayerPermissions(gameState, playerId);

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    const result = await sendAction(sessionId, playerId, "broadcast", {
      message: broadcastMsg,
      targetAgentIds: "all",
    });
    if (result.success) {
      showNotification("브로드캐스트 전송 완료", "success");
      setBroadcastMsg("");
      toggleBroadcastPanel();
    } else {
      showNotification(result.error ?? "오류", "error");
    }
  };

  return (
    <div className="leader-panel">
      <div className="leader-panel-header">
        <span className="leader-title">▶ 리더 지휘 센터</span>
        {perms.canBroadcast && (
          <button
            className="broadcast-toggle-btn"
            onClick={toggleBroadcastPanel}
          >
            📡 전체 지시
          </button>
        )}
      </div>

      {isBroadcastPanelOpen && perms.canBroadcast && (
        <div className="broadcast-compose">
          <textarea
            className="broadcast-textarea"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="전체 에이전트에게 지시 내용을 입력하세요..."
            rows={3}
          />
          <div className="broadcast-actions">
            <button className="broadcast-cancel-btn" onClick={toggleBroadcastPanel}>
              취소
            </button>
            <button
              className="broadcast-send-btn"
              onClick={handleBroadcast}
              disabled={!broadcastMsg.trim()}
            >
              전송
            </button>
          </div>
        </div>
      )}

      <AgentReportStack sessionId={sessionId} />
    </div>
  );
}