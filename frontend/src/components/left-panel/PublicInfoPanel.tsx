import { useGameStore } from "../../store/gameStore";
import { getZoneColor, getZoneLabel } from "../../utils/format";

export function PublicInfoPanel() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const { board, players, deck } = gameState;

  return (
    <div className="public-info-panel">
      <div className="info-section">
        <h3 className="info-section-title">보드 현황</h3>
        {deck && (
          <div className="deck-status-row">
            <span>전체 {deck.totalCards}장</span>
            <span>더미 {deck.remainingCards}장</span>
            <span>손패 {deck.inHandCards ?? 0}장</span>
            <span>보드 {deck.installedCards ?? 0}장</span>
            <span>버림 {deck.discardedCards}장</span>
          </div>
        )}
        {board.zones.map((zone) => (
          <div key={zone.zoneId} className="zone-status-row">
            <div
              className="zone-color-dot"
              style={{ backgroundColor: getZoneColor(zone.zoneId) }}
            />
            <span className="zone-status-label">{getZoneLabel(zone.zoneId)}</span>
            <span className="zone-status-progress">
              {zone.slots.filter(Boolean).length}/{zone.maxSlots}
            </span>
            <div className="zone-mini-progress">
              <div
                className="zone-mini-fill"
                style={{
                  width: `${(zone.slots.filter(Boolean).length / zone.maxSlots) * 100}%`,
                  backgroundColor: getZoneColor(zone.zoneId),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="info-section">
        <h3 className="info-section-title">참가자 현황</h3>
        {players.map((p) => (
          <div key={p.playerId} className="player-status-row">
            <span className="player-name">
              {p.name}
              {p.isHuman && <span className="human-tag"> (나)</span>}
            </span>
            <div className="player-hp-mini">
              <div
                className="player-hp-fill"
                style={{
                  width: `${(p.hp / p.maxHp) * 100}%`,
                  backgroundColor: p.hp / p.maxHp > 0.5 ? "#15803d" : "#dc2626",
                }}
              />
            </div>
            <span className="player-hp-text">HP {p.hp}</span>
          </div>
        ))}
      </div>

      <div className="info-section">
        <h3 className="info-section-title">상대 카드 뒷면</h3>
        {players
          .filter((p) => !p.isHuman)
          .map((p) => (
            <div key={`${p.playerId}-hand`} className="opponent-hand-row">
              <span className="opponent-name">{p.name}</span>
              <div className="opponent-card-backs">
                {p.hand.map((card) => {
                  const color = getZoneColor(String(card.zone));
                  const latestHint = card.hintHistory?.at(-1);
                  const truthLabel =
                    card.truth === "genuine"
                      ? "T"
                      : card.truth === "misinformation"
                        ? "F"
                        : "?";

                  return (
                    <div
                      key={card.cardId}
                      className="opponent-card-back"
                      style={{ borderColor: color }}
                    >
                      <span
                        className="opponent-card-zone"
                        style={{ backgroundColor: color }}
                      />
                      <span className={`opponent-card-truth ${card.truth}`}>
                        {truthLabel}
                      </span>
                      {latestHint && (
                        <span className="opponent-card-hint">
                          {latestHint.hintType === "zone" ? "색" : "진"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
