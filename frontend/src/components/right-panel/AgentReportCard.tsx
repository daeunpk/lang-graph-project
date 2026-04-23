import React, { useState } from "react";
import type { AgentProfile, AgentReport } from "../../types/agent";
import { useAgentStore } from "../../store/agentStore";
import { useUIStore } from "../../store/uiStore";
import { useGameStore } from "../../store/gameStore";
import { sendAction } from "../../utils/sendAction";
import { formatConfidence, truncate } from "../../utils/format";
import { getPlayerPermissions } from "../../utils/permissions";

interface AgentReportCardProps {
  agent: AgentProfile;
  report: AgentReport | null;
  sessionId: string;
}

const ROLE_ICONS: Record<string, string> = {
  flow_analyst: "🔵",
  risk_analyst: "🔴",
  resource_analyst: "🟡",
};

export function AgentReportCard({ agent, report, sessionId }: AgentReportCardProps) {
  const { openDrawer, setFollowupTarget, showNotification } = useUIStore();
  const { gameState } = useGameStore();
  const { setPendingFollowup } = useAgentStore();
  const [followupText, setFollowupText] = useState("");
  const [showFollowup, setShowFollowup] = useState(false);

  const playerId = localStorage.getItem("playerId") ?? "";
  const perms = getPlayerPermissions(gameState, playerId);
  const isLeaderMode = gameState?.config.interactionMode === "leader";

  const handleFollowup = async () => {
    if (!followupText.trim()) return;
    const result = await sendAction(sessionId, playerId, "followup", {
      targetAgentId: agent.agentId,
      question: followupText,
    });
    if (result.success) {
      setPendingFollowup(agent.agentId);
      setFollowupText("");
      setShowFollowup(false);
      showNotification(`${agent.name}에게 질문 전송`, "info");
    } else {
      showNotification(result.error ?? "오류", "error");
    }
  };

  return (
    <div className={`agent-report-card ${report ? "has-report" : "pending"}`}>
      <div className="agent-card-header">
        <div className="agent-identity">
          <span className="agent-role-icon">{ROLE_ICONS[agent.role] ?? "⚪"}</span>
          <div>
            <div className="agent-name">{agent.name}</div>
            <div className="agent-role-label">{agent.roleLabel}</div>
          </div>
        </div>
        {report && (
          <div className="agent-confidence">
            <span className="conf-label">확신도</span>
            <span className={`conf-value ${report.confidence >= 0.7 ? "high" : report.confidence >= 0.4 ? "mid" : "low"}`}>
              {formatConfidence(report.confidence)}
            </span>
          </div>
        )}
      </div>

      {!report ? (
        <div className="agent-card-pending">
          <div className="pending-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : (
        <>
          <div className="agent-card-content">
            <p className="agent-report-text">{truncate(report.content, 180)}</p>
            {report.uncertainties.length > 0 && (
              <div className="uncertainties">
                {report.uncertainties.map((u, i) => (
                  <span key={i} className="uncertainty-tag">? {u}</span>
                ))}
              </div>
            )}
            {report.suggestedAction && (
              <div className="suggested-action">
                <span className="suggested-label">제안:</span>
                <span className="suggested-text">{report.suggestedAction}</span>
              </div>
            )}
          </div>

          <div className="agent-card-actions">
            <button
              className="card-action-btn view"
              onClick={() => openDrawer(report.reportId)}
            >
              상세 보기
            </button>
            {isLeaderMode && perms.canFollowup && (
              <button
                className="card-action-btn followup"
                onClick={() => setShowFollowup((v) => !v)}
              >
                질문하기
              </button>
            )}
          </div>

          {showFollowup && (
            <div className="followup-compose">
              <input
                className="followup-input"
                type="text"
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                placeholder={`${agent.name}에게 질문...`}
                onKeyDown={(e) => e.key === "Enter" && handleFollowup()}
              />
              <button
                className="followup-send-btn"
                onClick={handleFollowup}
                disabled={!followupText.trim()}
              >
                전송
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}