import { useUIStore } from "../../store/uiStore";
import { sendAction } from "../../utils/sendAction";

interface TurnTimeoutModalProps {
  sessionId: string;
}

export function TurnTimeoutModal({ sessionId }: TurnTimeoutModalProps) {
  const { activeModal, closeModal, showNotification } = useUIStore();

  if (activeModal !== "turn_timeout") return null;

  const playerId = localStorage.getItem("playerId") ?? "";

  const handleRest = async () => {
    await sendAction(sessionId, playerId, "timeout", {});
    closeModal();
  };

  const handleInstall = () => {
    closeModal();
    showNotification("카드를 선택하고 슬롯을 클릭하세요.", "info");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box timeout-modal">
        <div className="timeout-icon">⏱</div>
        <h2 className="modal-title">시간 초과</h2>
        <p className="modal-desc">
          턴 제한 시간이 초과되었습니다. HP 회복 없이 이번 턴을 넘깁니다.
        </p>

        <div className="modal-actions">
          <button className="modal-btn rest" onClick={handleRest}>
            턴 넘기기
          </button>
          <button className="modal-btn confirm" onClick={handleInstall}>
            계속 행동
          </button>
        </div>
      </div>
    </div>
  );
}
