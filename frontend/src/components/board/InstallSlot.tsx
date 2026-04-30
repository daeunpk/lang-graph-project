import type { CSSProperties } from "react";
import type { InstalledCard } from "../../types/game";
import { useGameStore } from "../../store/gameStore";
import { useUIStore } from "../../store/uiStore";
import { getZoneColor } from "../../utils/format";
import { getPlayerPermissions } from "../../utils/permissions";

interface InstallSlotProps {
  slotIndex: number;
  zoneId: string;
  card: InstalledCard | null;
  isNext: boolean;
  sessionId: string;
}

export function InstallSlot({
  slotIndex,
  zoneId,
  card,
  isNext,
  sessionId: _sessionId,
}: InstallSlotProps) {
  const { gameState, selectedCardId } = useGameStore();
  const { selectZoneSlot, openModal } = useUIStore();
  const playerId = localStorage.getItem("playerId") ?? "";
  const perms = getPlayerPermissions(gameState, playerId);

  const handleClick = () => {
    if (!perms.canInstall || !selectedCardId || card !== null) return;
    if (!isNext) return;

    selectZoneSlot(zoneId, slotIndex);
    openModal("confirm_install", { cardId: selectedCardId, zoneId, slotIndex });
  };

  const zoneColor = getZoneColor(zoneId);

  return (
    <div
      className={`install-slot ${card ? "filled" : ""} ${
        isNext && perms.canInstall && selectedCardId ? "droppable" : ""
      } ${card && card.isCorrect ? "correct" : card ? "incorrect" : ""}`}
      onClick={handleClick}
      style={{ "--zone-color": zoneColor } as CSSProperties}
    >
      <span className="slot-index">{slotIndex + 1}</span>

      {card ? (
        <div className="slot-card">
          <span className="slot-card-number">{card.number}</span>
          {!card.isCorrect && <span className="slot-error-mark">✗</span>}
        </div>
      ) : (
        isNext && (
          <div className="slot-next-indicator" style={{ color: zoneColor }}>
            ▾
          </div>
        )
      )}
    </div>
  );
}
