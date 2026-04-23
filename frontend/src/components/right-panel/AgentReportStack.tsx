import React from "react";
import { AgentReportCard } from "./AgentReportCard";
import { useAgentStore } from "../../store/agentStore";
import { useGameStore } from "../../store/gameStore";

interface AgentReportStackProps {
  sessionId: string;
}

export function AgentReportStack({ sessionId }: AgentReportStackProps) {
  const { reports, agents, isGenerating } = useAgentStore();
  const { gameState } = useGameStore();
  const currentTurn = gameState?.currentTurn ?? 0;

  const currentReports = reports.filter((r) => r.turn === currentTurn);

  return (
    <div className="agent-report-stack">
      <div className="stack-header">
        <span className="stack-title">에이전트 보고</span>
        {isGenerating && (
          <div className="generating-indicator">
            <div className="generating-dot" />
            <span>분석 중...</span>
          </div>
        )}
      </div>

      {agents.length === 0 && (
        <p className="stack-empty">에이전트 정보 로딩 중...</p>
      )}

      {agents.map((agent) => {
        const report = currentReports.find((r) => r.agentId === agent.agentId);
        return (
          <AgentReportCard
            key={agent.agentId}
            agent={agent}
            report={report ?? null}
            sessionId={sessionId}
          />
        );
      })}
    </div>
  );
}