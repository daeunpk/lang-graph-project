export type AgentRole = "flow_analyst" | "risk_analyst" | "resource_analyst";

export interface AgentProfile {
  agentId: string;
  name: string;
  role: AgentRole;
  roleLabel: string;
  roleDescription: string;
  personality: string;
}

export interface AgentReport {
  reportId: string;
  agentId: string;
  agentName: string;
  role: AgentRole;
  turn: number;
  content: string;
  confidence: number; // 0-1
  suggestedAction?: string;
  uncertainties: string[];
  isFollowupResponse: boolean;
  followupQuestion?: string;
  timestamp: string;
}

export interface AgentMessage {
  messageId: string;
  agentId: string;
  agentName: string;
  content: string;
  messageType: "report" | "followup_response" | "free_chat" | "broadcast_ack";
  turn: number;
  timestamp: string;
}

export interface AgentState {
  agents: AgentProfile[];
  reports: AgentReport[];
  messages: AgentMessage[];
  pendingFollowup: string | null; // agentId waiting for followup
  isGenerating: boolean;
}