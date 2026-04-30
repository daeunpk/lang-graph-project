import { useGameStore } from "../../store/gameStore";

interface CardView {
  cardId: string;
  number: number | null;
  zone: string;
  truth: "genuine" | "misinformation" | "unknown";
}

interface CardProps {
  card: CardView;
  isMine: boolean;
  onSelect?: (cardId: string) => void;
}

export function Card({ card, isMine, onSelect }: CardProps) {
  const isHumanTurn = useGameStore((state) => state.isHumanTurn);
  const isDisabled = isMine && !isHumanTurn;

  const zoneClass = !isMine && card.zone !== "unknown" ? card.zone : "";
  const truthLabel =
    card.truth === "genuine" ? "T" : card.truth === "misinformation" ? "F" : "?";

  return (
    <div
      className={`game-card ${isMine ? "mine" : zoneClass} ${
        isDisabled ? "disabled" : ""
      }`}
      onClick={() => {
        if (!isDisabled) onSelect?.(card.cardId);
      }}
    >
      <div className="card-inner">
        {isMine ? (
          <span className="card-number">{card.number ?? "?"}</span>
        ) : (
          <>
            <span className="card-truth">{truthLabel}</span>
            <span className="card-back-hint">?</span>
          </>
        )}
      </div>
    </div>
  );
}
