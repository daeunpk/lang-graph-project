import { InstallationBoard } from "./InstallationBoard";
import { RecentActionBanner } from "./RecentActionBanner";
import { useGameStore } from "../../store/gameStore";

interface CenterBoardAreaProps {
  sessionId: string;
}

export function CenterBoardArea({ sessionId }: CenterBoardAreaProps) {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="center-board-area">
      <RecentActionBanner />
      <InstallationBoard board={gameState.board} sessionId={sessionId} />
    </div>
  );
}