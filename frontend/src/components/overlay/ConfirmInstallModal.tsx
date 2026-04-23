import React from "react";
import { useUIStore } from "../../store/uiStore";
import { useGameStore } from "../../store/gameStore";
import { sendAction } from "../../utils/sendAction";
import { getZoneLabel, getZoneColor } from "../../utils/format";

interface ConfirmInstallModalProps {
  sessionId: string;
}

export function ConfirmInstallModal({ sessionId }: ConfirmInstallModalProps) {
  const { activeModal, modalPayload, closeModal, showNotification, selectZoneSlot } = useUIStore();
  const { gameState, myHand } = useGameStore();

  if (activeModal !== "confirm_install") return null;

  const cardId = modalPayload?.cardId as string;
  const zoneId = modalPayload?.zoneId as string;
  const slotIndex = modalPayload?.slotIndex as number;

  const card = myHand.find((c) => c.cardId === cardId);
  const playerId = localStorage.getItem("playerId") ?? "";

  const handleInstall = async () => {
    const result = await sendAction(sessionId, playerId, "install", {
      cardId,
      targetZone: zoneId,
      targetSlot: slotIndex,
    });
    if (result.success) {
      showNotification("카드 설치 완료", "success");
      closeModal();
      selectZoneSlot(null, null);
    } else {
      showNotification(result.error ?? "설치 실패", "error");
    }
  };

  const zoneColor = getZoneColor(zoneId);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-box confirm-install" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">설치 확인</h2>
        <div className="install-preview">
          <div className="install-preview-card" style={{ borderColor: zoneColor }}>
            <span className="preview-number">{card?.knownNumber ?? "?"}</span>
            <span className="preview-zone" style={{ color: zoneColor }}>
              {card?.knownZone?.toUpperCase() ?? "?"}
            </span>
          </div>
          <span className="install-arrow">→</span>
          <div className="install-preview-target" style={{ borderColor: zoneColor }}>
            <div className="target-zone">{getZoneLabel(zoneId)}</div>
            <div className="target-slot">슬롯 {slotIndex + 1}</div>
          </div>
        </div>
        <p className="modal-warning">
          ⚠ 오정보 카드를 설치하면 오류가 발생할 수 있습니다.
        </p>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={closeModal}>취소</button>
          <button className="modal-btn confirm" onClick={handleInstall}>설치</button>
        </div>
      </div>
    </div>
  );
}