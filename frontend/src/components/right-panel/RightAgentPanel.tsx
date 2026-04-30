import { LeaderPanel } from "./LeaderPanel";
import { AgentReportStack } from "./AgentReportStack";
import { useGameStore } from "../../store/gameStore";

interface RightAgentPanelProps {
  sessionId: string;
}

export function RightAgentPanel({ sessionId }: RightAgentPanelProps) {
  const { gameState } = useGameStore();
  const isLeaderMode = gameState?.config.interactionMode === "leader";

  return (
    <div className="right-agent-panel">
      {isLeaderMode ? (
        <LeaderPanel sessionId={sessionId} />
      ) : (
        <AgentReportStack sessionId={sessionId} />
      )}
    </div>
  );
}