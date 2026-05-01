import { AgentReportCard } from "./AgentReportCard";
import { useAgentStore } from "../../store/agentStore";
import type { AgentProfile } from "../../types/agent";

interface AgentReportStackProps {
  sessionId: string;
}

export function AgentReportStack({ sessionId }: AgentReportStackProps) {
  const { reports, agents, messages, isGenerating } = useAgentStore();
  const recentInfoMessages = messages
    .filter((m) => m.messageType === "free_chat" || m.messageType === "broadcast_ack")
    .slice(-12)
    .reverse();

  return (
    <div className="agent-report-stack">
      <div className="stack-header">
        <span className="stack-title">에이전트 보고</span>
        {isGenerating && (
          <div className="generating-indicator">
            <span>분석 중...</span>
          </div>
        )}
      </div>

      <div className="info-feed">
        <div className="info-feed-title">공유된 정보</div>
        {recentInfoMessages.length === 0 ? (
          <p className="info-feed-empty">아직 공유된 정보가 없습니다.</p>
        ) : (
          recentInfoMessages.map((message) => (
            <div key={message.messageId} className="info-feed-item">
              <div className="info-feed-meta">
                <span>{message.agentName}</span>
                <span>Turn {message.turn}</span>
              </div>
              <p>{message.content}</p>
            </div>
          ))
        )}
      </div>

      {reports.length === 0 ? (
        <p className="stack-empty">아직 보고서가 없습니다.</p>
      ) : (
        reports.map((report) => {
          const fallbackAgent: AgentProfile = {
            agentId: report.agentId,
            name: report.agentName || report.agentId,
            role: report.role,
            roleLabel: "에이전트",
            roleDescription: "보고서를 생성한 에이전트입니다.",
            personality: "balanced",
          };

          const agentProfile =
            agents.find((a) => a.agentId === report.agentId) ?? fallbackAgent;

          return (
            <AgentReportCard
              key={report.reportId}
              agent={agentProfile}
              report={report}
              sessionId={sessionId}
            />
          );
        })
      )}
    </div>
  );
}
