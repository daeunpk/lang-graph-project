import { useCallback } from "react";
import { useAgentStore } from "../store/agentStore";
import { useGameStore } from "../store/gameStore";
import type { AgentReport } from "../types/agent";

export function useAgentReports() {
  const { reports, agents, isGenerating } = useAgentStore();
  const { gameState } = useGameStore();

  const currentTurn = gameState?.currentTurn ?? 0;

  const currentTurnReports: AgentReport[] = reports.filter(
    (r) => r.turn === currentTurn
  );

  const getReportByAgent = useCallback(
    (agentId: string): AgentReport | null => {
      return (
        currentTurnReports.find((r) => r.agentId === agentId) ?? null
      );
    },
    [currentTurnReports]
  );

  const allReportsReceived =
    agents.length > 0 &&
    agents.every((a) => currentTurnReports.some((r) => r.agentId === a.agentId));

  const avgConfidence =
    currentTurnReports.length > 0
      ? currentTurnReports.reduce((acc, r) => acc + r.confidence, 0) /
        currentTurnReports.length
      : 0;

  const highConfidenceReports = currentTurnReports.filter(
    (r) => r.confidence >= 0.7
  );

  const uncertainReports = currentTurnReports.filter(
    (r) => r.uncertainties.length > 0
  );

  return {
    currentTurnReports,
    getReportByAgent,
    allReportsReceived,
    avgConfidence,
    highConfidenceReports,
    uncertainReports,
    isGenerating,
    agents,
  };
}