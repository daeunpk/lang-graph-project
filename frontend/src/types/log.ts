export type LogLevel = "info" | "success" | "warning" | "error" | "system";

export interface LogEntry {
  logId: string;
  turn: number;
  level: LogLevel;
  message: string;
  detail?: string;
  actorId?: string;
  actionType?: string;
  timestamp: string;
}

export interface SystemEvent {
  eventId: string;
  eventType:
    | "install_success"
    | "install_fail"
    | "discard"
    | "rest"
    | "broadcast"
    | "followup"
    | "hp_change"
    | "error_added"
    | "threshold_reached"
    | "game_over"
    | "turn_start"
    | "turn_end";
  turn: number;
  data: Record<string, unknown>;
  timestamp: string;
}