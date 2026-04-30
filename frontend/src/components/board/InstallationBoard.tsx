import { ZoneColumn } from "./ZoneColumn";
import type { BoardState } from "../../types/game";

interface InstallationBoardProps {
  board: BoardState;
  sessionId: string;
}

export function InstallationBoard({ board, sessionId }: InstallationBoardProps) {
  return (
    <div className="installation-board">
      <div className="board-header">
        <span className="board-title">설치 보드</span>
        <div className={`error-counter ${board.errorCount >= board.maxErrors * 0.75 ? "danger" : ""}`}>
          오류: {board.errorCount}/{board.maxErrors}
        </div>
      </div>
      <div className="board-zones">
        {board.zones.map((zone) => (
          <ZoneColumn key={zone.zoneId} zone={zone} sessionId={sessionId} />
        ))}
      </div>
    </div>
  );
}