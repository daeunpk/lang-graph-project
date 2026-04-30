export type CardZone = "red" | "blue" | "green" | "yellow" | "purple";
export type CardTruth = "genuine" | "misinformation" | "unknown";

export interface Card {
  cardId: string;
  number: number;
  zone: CardZone;
  truth: CardTruth;
  // What the holder knows
  knownNumber: number | null;
  knownZone: CardZone | null;
  knownTruth: CardTruth | null;
  hintHistory: HintEntry[];
}

export interface HintEntry {
  turn: number;
  hintType: "number" | "zone" | "truth";
  value: string;
  givenBy: string;
  message?: string;
}

export interface HandCard extends Card {
  isSelected: boolean;
  isPlayable: boolean;
}
