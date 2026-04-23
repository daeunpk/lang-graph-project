import React from "react";
import { useUIStore } from "../../store/uiStore";
import { useGameStore } from "../../store/gameStore";
import { sendAction } from "../../utils/sendAction";

export function ActionModal() {
  const { activeModal, modalPayload, closeModal, showNotification } = useUIStore();
  const { gameState, selectedCardId } = useGameStore();

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
      </div>
    </div>
  );
}