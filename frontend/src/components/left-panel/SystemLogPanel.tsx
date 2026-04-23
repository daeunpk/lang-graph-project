import React from "react";
import { useGameStore } from "../../store/gameStore";
import { formatTimestamp } from "../../utils/format";

const LEVEL_COLORS = {
  info: "#94a3b8",
  success: "#4ade80",
  warning: "#facc15",
  error: "#f87171",
  system: "#818cf8",
};

export function SystemLogPanel() {
  const { logs } = useGameStore();

  return (
    <div className="system-log-panel">
      <h3 className="log-title">시스템 로그</h3>
      {logs.length === 0 && (
        <p className="log-empty">아직 로그가 없습니다.</p>
      )}
      <div className="log-list">
        {logs.map((log) => (
          <div key={log.logId} className={`log-entry level-${log.level}`}>
            <span
              className="log-level-dot"
              style={{ backgroundColor: LEVEL_COLORS[log.level] }}
            />
            <div className="log-content">
              <span className="log-message">{log.message}</span>
              {log.detail && (
                <span className="log-detail">{log.detail}</span>
              )}
            </div>
            <span className="log-time">{formatTimestamp(log.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}