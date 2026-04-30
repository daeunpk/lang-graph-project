import { useState } from "react";
import { useUIStore } from "../../store/uiStore";
import { useGameStore } from "../../store/gameStore";
import { sendAction } from "../../utils/sendAction";
import { getZoneLabel } from "../../utils/format";

export function ActionModal() {
  const { activeModal, modalPayload, closeModal, showNotification } = useUIStore();
  const { gameState, selectedCardId } = useGameStore();
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [infoType, setInfoType] = useState<"zone" | "truth">("zone");
  const [infoValue, setInfoValue] = useState("red");
  const [infoText, setInfoText] = useState("");
  const [targetCardIds, setTargetCardIds] = useState<string[]>([]);

  if (activeModal !== "action") return null;

  const sessionId = gameState?.sessionId ?? "";
  const playerId = localStorage.getItem("playerId") ?? "";
  const actionType = modalPayload?.type as string;

  const handleDiscard = async () => {
    const cardId = (modalPayload?.cardId as string) ?? selectedCardId;
    if (!cardId) return;
    const result = await sendAction(sessionId, playerId, "discard", { cardId });
    if (result.success) {
      showNotification("카드를 버렸습니다.", "info");
      closeModal();
    } else {
      showNotification(result.error ?? "오류", "error");
    }
  };

  const otherPlayers = gameState?.players.filter((p) => !p.isHuman) ?? [];
  const zones = gameState?.board.zones.map((z) => z.zoneId) ?? [];
  const selectedTargetId = targetPlayerId || otherPlayers[0]?.playerId || "";
  const targetPlayer = otherPlayers.find((p) => p.playerId === selectedTargetId);

  const handleGiveInfo = async () => {
    const targetId = selectedTargetId;
    if (!targetId) return;

    const result = await sendAction(sessionId, playerId, "give_info", {
      targetPlayerId: targetId,
      infoType,
      infoValue,
      targetCardIds,
      message: infoText.trim(),
    });

    if (result.success) {
      showNotification("정보를 전달했습니다.", "success");
      closeModal();
      setInfoText("");
      setTargetCardIds([]);
      return;
    }

    showNotification(result.error ?? "정보 전달 실패", "error");
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {actionType === "discard" && (
          <>
            <h2 className="modal-title">카드 버리기</h2>
            <p className="modal-desc">선택한 카드를 버리겠습니까? 새 카드가 보충됩니다.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closeModal}>취소</button>
              <button className="modal-btn confirm" onClick={handleDiscard}>버리기</button>
            </div>
          </>
        )}
        {actionType === "install_prompt" && (
          <>
            <h2 className="modal-title">카드 설치</h2>
            <p className="modal-desc">보드에서 설치할 슬롯을 클릭하세요.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closeModal}>취소</button>
            </div>
          </>
        )}
        {actionType === "give_info" && (
          <>
            <h2 className="modal-title">정보 주기</h2>
            <p className="modal-desc">
              HP 1을 사용해 동료 한 명에게 색깔 또는 진위 정보를 전달합니다.
            </p>

            <label className="modal-field">
              <span>대상</span>
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setTargetPlayerId(e.target.value);
                  setTargetCardIds([]);
                }}
              >
                {otherPlayers.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-field">
              <span>가리킬 카드</span>
              <div className="hint-card-picker">
                {targetPlayer?.hand.map((card, index) => {
                  const checked = targetCardIds.includes(card.cardId);
                  const truthLabel =
                    card.truth === "genuine"
                      ? "T"
                      : card.truth === "misinformation"
                        ? "F"
                        : "?";

                  return (
                    <button
                      key={card.cardId}
                      type="button"
                      className={`hint-target-card ${checked ? "selected" : ""}`}
                      onClick={() =>
                        setTargetCardIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== card.cardId)
                            : [...prev, card.cardId]
                        )
                      }
                    >
                      <span className="hint-card-index">{index + 1}</span>
                      <span>{card.zone}</span>
                      <strong>{truthLabel}</strong>
                    </button>
                  );
                })}
                {targetPlayer && targetPlayer.hand.length === 0 && (
                  <span className="hint-card-empty">카드가 없습니다.</span>
                )}
              </div>
            </div>

            <label className="modal-field">
              <span>정보 종류</span>
              <select
                value={infoType}
                onChange={(e) => {
                  const nextType = e.target.value as "zone" | "truth";
                  setInfoType(nextType);
                  setInfoValue(nextType === "zone" ? zones[0] ?? "red" : "genuine");
                }}
              >
                <option value="zone">색깔 정보</option>
                <option value="truth">진위 정보</option>
              </select>
            </label>

            <label className="modal-field">
              <span>값</span>
              <select
                value={infoValue}
                onChange={(e) => setInfoValue(e.target.value)}
              >
                {infoType === "zone" ? (
                  zones.map((zoneId) => (
                    <option key={zoneId} value={zoneId}>
                      {getZoneLabel(zoneId)}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="genuine">맞는 정보</option>
                    <option value="misinformation">오정보</option>
                  </>
                )}
              </select>
            </label>

            <label className="modal-field">
              <span>메시지</span>
              <textarea
                value={infoText}
                onChange={(e) => setInfoText(e.target.value)}
                placeholder="예: 이 색 카드가 있어. / 이 카드 중 하나는 맞는 정보야."
              />
            </label>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closeModal}>취소</button>
              <button className="modal-btn confirm" onClick={handleGiveInfo}>전달</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
