const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function sendAction<T = unknown>(
  sessionId: string,
  playerId: string,
  actionType: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/game/${sessionId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, actionType, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail ?? "서버 오류" };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: "네트워크 오류" };
  }
}

export async function createSession(
  condition: string,
  humanName: string
): Promise<{ sessionId: string; playerId: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/game/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition, humanName }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchGameState(sessionId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/game/${sessionId}/state`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}