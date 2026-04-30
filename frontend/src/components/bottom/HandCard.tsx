import type { CSSProperties, MouseEvent } from "react";
import type { HandCard as HandCardType } from "../../types/card";
import { useGameStore } from "../../store/gameStore";
import { useUIStore } from "../../store/uiStore";
import { getZoneColor } from "../../utils/format";
import { getPlayerPermissions } from "../../utils/permissions";

interface HandCardProps {
  card: HandCardType;
  sessionId: string;
}

export function HandCard({ card, sessionId: _sessionId }: HandCardProps) {
  const { gameState, selectCard, selectedCardId } = useGameStore();
  const { openModal } = useUIStore();
  const playerId = localStorage.getItem("playerId") ?? "";
  const perms = getPlayerPermissions(gameState, playerId);

  const isSelected = card.cardId === selectedCardId;
  const zoneColor = card.knownZone ? getZoneColor(card.knownZone) : "#374151";
  const latestHint = card.hintHistory?.at(-1);

  const handleClick = () => {
    if (!perms.canSelectCard) return;
    selectCard(isSelected ? null : card.cardId);
  };

  const handleDiscard = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!perms.canDiscard) return;
    openModal("action", { type: "discard", cardId: card.cardId });
  };

  return (
    <div
      className={`hand-card ${isSelected ? "selected" : ""} ${
        !perms.canSelectCard ? "disabled" : ""
      }`}
      onClick={handleClick}
      style={{ "--card-zone-color": zoneColor } as CSSProperties}
    >
      <div className="card-zone-stripe" style={{ backgroundColor: zoneColor }} />

      <div className="card-body">
        <div className="card-number">
          {card.knownNumber !== null ? (
            <span className="known-number">{card.knownNumber}</span>
          ) : (
            <span className="unknown-number">?</span>
          )}
        </div>

        <div className="card-zone-label">
          {card.knownZone ? (
            <span className="known-zone" style={{ color: zoneColor }}>
              {card.knownZone.toUpperCase()}
            </span>
          ) : (
            <span className="unknown-zone">?</span>
          )}
        </div>

        {card.knownTruth !== null && card.knownTruth !== "unknown" && (
          <div className={`card-truth ${card.knownTruth}`}>
            {card.knownTruth === "genuine" ? "✓" : "✗"}
          </div>
        )}
      </div>

      <div className="card-hints">
        {latestHint && (
          <span className="hint-count">
            {latestHint.hintType}:{latestHint.value}
          </span>
        )}
      </div>

      {isSelected && perms.canDiscard && (
        <button className="card-discard-btn" onClick={handleDiscard} title="버리기">
          ✕
        </button>
      )}

      {isSelected && (
        <div className="card-selected-glow" style={{ borderColor: zoneColor }} />
      )}
    </div>
  );
}
