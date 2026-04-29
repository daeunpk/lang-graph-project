import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useAgentStore } from "../store/agentStore";
import { useUIStore } from "../store/uiStore";
import type { GameState } from "../types/game";
import type { AgentReport, AgentMessage } from "../types/agent";
import type { LogEntry } from "../types/log";
import type { HandCard } from "../types/card";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

type WSMessage =
  | { type: "game_state"; payload: GameState }
  | { type: "hand_update"; payload: HandCard[] }
  | { type: "agent_report"; payload: AgentReport }
  | { type: "agent_message"; payload: AgentMessage }
  | { type: "log_entry"; payload: LogEntry }
  | { type: "action_result"; payload: { success: boolean; message: string; hpDelta?: number } }
  | { type: "generating_start"; payload: { agentId: string } }
  | { type: "generating_end"; payload: { agentId: string } }
  | { type: "game_over"; payload: { reason: string; winner?: string } }
  | { type: "error"; payload: { message: string } };

export function useGameSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const { setGameState, setMyHand, addLog, setActionResult } = useGameStore();
  const { addReport, addMessage, setGenerating } = useAgentStore();
  const { showNotification, openModal } = useUIStore();

  const handleMessage = useCallback(
    (raw: string) => {
      let msg: WSMessage;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      switch (msg.type) {
        case "game_state":
          setGameState(msg.payload);
          break;
        case "hand_update":
          setMyHand(msg.payload);
          break;
        case "agent_report":
          console.log("새로운 리포트 추가 시도: ", msg.payload);
          addReport(msg.payload);
          setGenerating(false);
          break;
        case "agent_message":
          addMessage(msg.payload);
          break;
        case "log_entry":
          addLog(msg.payload);
          break;
        case "action_result":
          setActionResult(msg.payload);
          if (!msg.payload.success) {
            showNotification(msg.payload.message, "error");
          } else {
            showNotification(msg.payload.message, "success");
          }
          break;
        case "generating_start":
          console.log("에이전트 생각 시작")
          setGenerating(true);
          break;
        case "generating_end":
          console.log("에이전트 생각 종료")
          setGenerating(false);
          break;
        case "game_over":
          openModal("game_end", {
            reason: msg.payload.reason,
            winner: msg.payload.winner,
          });
          break;
        case "error":
          showNotification(msg.payload.message, "error");
          break;
      }
    },
    [setGameState, setMyHand, addLog, setActionResult, addReport, addMessage, setGenerating, showNotification, openModal]
  );

  const connect = useCallback(() => {
    if (!sessionId || !mountedRef.current) return;
    const url = `${WS_BASE}/ws/game/${sessionId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (ev) => handleMessage(ev.data);

    ws.onclose = () => {
      if (mountedRef.current) {
        reconnectRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId, handleMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}