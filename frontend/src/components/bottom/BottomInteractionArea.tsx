import React from "react";
import { MyHandSection } from "./MyHandSection";
import { ActionToolbar } from "./ActionToolbar";
import { LeaderCommunicationPanel } from "./LeaderCommunicationPanel";
import { useGameStore } from "../../store/gameStore";

interface BottomInteractionAreaProps {
  sessionId: string;
}

export function BottomInteractionArea({ sessionId }: BottomInteractionAreaProps) {
  const { gameState } = useGameStore();
  const isLeaderMode = gameState?.config.interactionMode === "leader";
  const isFreeMode = gameState?.config.interactionMode === "free";

  return (
    <div className="bottom-interaction-area">
      <MyHandSection sessionId={sessionId} />
      <div className="bottom-right-cluster">
        <ActionToolbar sessionId={sessionId} />
        {isFreeMode && <LeaderCommunicationPanel sessionId={sessionId} isFreeMode />}
        {isLeaderMode && <div className="bottom-leader-hint">↑ 우측 패널에서 에이전트에게 질문하세요</div>}
      </div>
    </div>
  );
}