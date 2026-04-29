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

  const currentReports = reports;

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

        {/* 에이전트 리스트 기준이 아니라, 실제 들어온 '보고서' 기준으로 먼저 그려봅니다. */}
        {currentReports.length === 0 ? (
        <p className="stack-empty">아직 보고서가 없습니다.</p>
        ) : (
        currentReports.map((report) => {
            // 보고서에 맞는 에이전트 프로필을 찾되, 없으면 기본값 생성
            const agentProfile = agents.find((a) => a.agentId === report.agentId) || {
            agentId: report.agentId,
            name: report.agentName || report.agentId,
            role: report.role,
            roleLabel: "에이전트"
            };

            return (
            <AgentReportCard
                key={report.reportId}
                agent={agentProfile as any}
                report={report}
                sessionId={sessionId}
            />
            );
        })
        )}
    </div>
    );
}