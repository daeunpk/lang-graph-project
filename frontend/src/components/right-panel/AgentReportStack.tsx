import { AgentReportCard } from "./AgentReportCard";
import { useAgentStore } from "../../store/agentStore";
import type { AgentProfile } from "../../types/agent";

interface AgentReportStackProps {
  sessionId: string;
}

export function AgentReportStack({ sessionId }: AgentReportStackProps) {
  const { reports, agents, isGenerating } = useAgentStore();

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
