export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function formatCardId(cardId: string): string {
  return cardId.slice(-6).toUpperCase();
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

export const ZONE_COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
};

export const ZONE_LABEL_MAP: Record<string, string> = {
  red: "적색 구역",
  blue: "청색 구역",
  green: "녹색 구역",
  yellow: "황색 구역",
  purple: "자색 구역",
};

export function getZoneColor(zoneId: string): string {
  return ZONE_COLOR_MAP[zoneId] ?? "#6b7280";
}

export function getZoneLabel(zoneId: string): string {
  return ZONE_LABEL_MAP[zoneId] ?? zoneId;
}