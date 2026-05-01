import { useGameStore } from "../../store/gameStore";
import { useUIStore } from "../../store/uiStore";
import { sendAction } from "../../utils/sendAction";
import { getPlayerPermissions } from "../../utils/permissions";

interface ActionToolbarProps {
  sessionId: string;
}

export function ActionToolbar({ sessionId }: ActionToolbarProps) {
  const { gameState, selectedCardId } = useGameStore();
  const { openModal, showNotification } = useUIStore();
  const playerId = localStorage.getItem("playerId") ?? "";
  const perms = getPlayerPermissions(gameState, playerId);

  const handleRest = async () => {
    if (!perms.canRest) return;
    const result = await sendAction(sessionId, playerId, "rest", {});
    if (!result.success) showNotification(result.error ?? "오류", "error");
  };

  const handleInstall = () => {
    if (!selectedCardId || !perms.canInstall) return;
    showNotification("보드에서 삼각형이 표시된 슬롯을 클릭하세요.", "info");
  };

  const handleGiveInfo = () => {
    if (!perms.isHumanTurn) return;
    openModal("action", { type: "give_info" });
  };

  const handleDiscard = () => {
    if (!selectedCardId || !perms.canDiscard) return;
    openModal("action", { type: "discard", cardId: selectedCardId });
  };

  if (!perms.isHumanTurn) return null;

  return (
    <div className="action-toolbar">
      <button
        className="action-btn info"
        onClick={handleGiveInfo}
        title="HP 1을 사용해 동료에게 카드 정보를 전달"
      >
        <span className="action-icon">i</span>
        <span className="action-label">정보</span>
      </button>

      <button
        className={`action-btn install ${!selectedCardId ? "disabled" : ""}`}
        onClick={handleInstall}
        disabled={!selectedCardId}
        title="선택한 카드를 보드에 설치"
      >
        <span className="action-icon">⬆</span>
        <span className="action-label">설치</span>
      </button>

      <button
        className={`action-btn discard ${!selectedCardId ? "disabled" : ""}`}
        onClick={handleDiscard}
        disabled={!selectedCardId}
        title="선택한 카드를 버리기"
      >
        <span className="action-icon">✕</span>
        <span className="action-label">버리기</span>
      </button>

      <button
        className="action-btn rest"
        onClick={handleRest}
        title="휴식: HP 회복"
      >
        <span className="action-icon">♥</span>
        <span className="action-label">휴식</span>
      </button>
    </div>
  );
}
