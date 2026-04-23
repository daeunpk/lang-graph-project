import React from "react";
import { useUIStore } from "../../store/uiStore";
import { useAgentStore } from "../../store/agentStore";
import { formatTimestamp, formatConfidence } from "../../utils/format";

export function DetailedReportDrawer() {
  const { drawerOpen, drawerReportId, closeDrawer } = useUIStore();
  const { reports } = useAgentStore();

  if (!drawerOpen || !drawerReportId) return null;

  const report = reports.find((r) => r.reportId === drawerReportId);
  if (!report) return null;

  return (
    <div className="drawer-overlay" onClick={closeDrawer}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">상세 보고서</h2>
          <button className="drawer-close" onClick={closeDrawer}>✕</button>
        </div>

        <div className="drawer-meta">
          <span className="drawer-agent">{report.agentName}</span>
          <span className="drawer-turn">Turn {report.turn}</span>
          <span className={`drawer-confidence conf-${report.confidence >= 0.7 ? "high" : report.confidence >= 0.4 ? "mid" : "low"}`}>
            확신도: {formatConfidence(report.confidence)}
          </span>
          <span className="drawer-time">{formatTimestamp(report.timestamp)}</span>
        </div>

        <div className="drawer-content">
          <h3 className="drawer-section-title">보고 내용</h3>
          <p className="drawer-body">{report.content}</p>

          {report.isFollowupResponse && report.followupQuestion && (
            <div className="drawer-followup">
              <h3 className="drawer-section-title">후속 질문 응답</h3>
              <div className="followup-q">Q: {report.followupQuestion}</div>
            </div>
          )}

          {report.uncertainties.length > 0 && (
            <div className="drawer-uncertainties">
              <h3 className="drawer-section-title">불확실 항목</h3>
              <ul className="uncertainty-list">
                {report.uncertainties.map((u, i) => (
                  <li key={i} className="uncertainty-item">⚠ {u}</li>
                ))}
              </ul>
            </div>
          )}

          {report.suggestedAction && (
            <div className="drawer-suggestion">
              <h3 className="drawer-section-title">제안 행동</h3>
              <p className="suggestion-text">▸ {report.suggestedAction}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}