import React from "react";
import { MainLayout } from "./MainLayout";
import { TopStatusBar } from "../topbar/TopStatusBar";
import { LeftPanel } from "../left-panel/LeftPanel";
import { CenterBoardArea } from "../board/CenterBoardArea";
import { RightAgentPanel } from "../right-panel/RightAgentPanel";
import { BottomInteractionArea } from "../bottom/BottomInteractionArea";
import { ActionModal } from "../overlay/ActionModal";
import { ConfirmInstallModal } from "../overlay/ConfirmInstallModal";
import { DetailedReportDrawer } from "../overlay/DetailedReportDrawer";
import { TurnTimeoutModal } from "../overlay/TurnTimeoutModal";
import { GameEndModal } from "../overlay/GameEndModal";
import { useGameStore } from "../../store/gameStore";
import { useUIStore } from "../../store/uiStore";

interface GameShellProps {
  sessionId: string;
}

export function GameShell({ sessionId }: GameShellProps) {
  const { gameState, isLoading } = useGameStore();
  const { notification } = useUIStore();

  if (isLoading) {
    return (
      <div className="game-loading">
        <div className="loading-spinner" />
        <span>게임 로딩 중...</span>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-loading">
        <span>게임 상태를 불러올 수 없습니다.</span>
      </div>
    );
  }

  return (
    <>
      <MainLayout
        topBar={<TopStatusBar />}
        leftPanel={<LeftPanel />}
        centerBoard={<CenterBoardArea sessionId={sessionId} />}
        rightPanel={<RightAgentPanel sessionId={sessionId} />}
        bottomArea={<BottomInteractionArea sessionId={sessionId} />}
        overlays={
          <>
            <ActionModal />
            <ConfirmInstallModal sessionId={sessionId} />
            <DetailedReportDrawer />
            <TurnTimeoutModal sessionId={sessionId} />
            <GameEndModal sessionId={sessionId} />
          </>
        }
      />
      {notification && (
        <div className={`global-notification ${notification.level}`}>
          {notification.message}
        </div>
      )}
    </>
  );
}