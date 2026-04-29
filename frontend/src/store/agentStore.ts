import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { AgentProfile, AgentReport, AgentMessage } from "../types/agent";

interface AgentStoreState {
  agents: AgentProfile[];
  reports: AgentReport[];
  messages: AgentMessage[];
  pendingFollowupAgentId: string | null;
  isGenerating: boolean;
  expandedReportId: string | null;
}

interface AgentStoreActions {
  setAgents: (agents: AgentProfile[]) => void;
  addReport: (report: AgentReport) => void;
  clearReports: () => void;
  addMessage: (message: AgentMessage) => void;
  clearMessages: () => void;
  setPendingFollowup: (agentId: string | null) => void;
  setGenerating: (generating: boolean) => void;
  setExpandedReport: (reportId: string | null) => void;
  getReportsForTurn: (turn: number) => AgentReport[];
}

export const useAgentStore = create<AgentStoreState & AgentStoreActions>()(
  immer((set, get) => ({
    agents: [],
    reports: [],
    messages: [],
    pendingFollowupAgentId: null,
    isGenerating: false,
    expandedReportId: null,

    setAgents: (agents) =>
      set((s) => {
        s.agents = agents;
      }),
    
    addReport: (report) =>
        set((s) => {
            const exists = s.reports.findIndex((r) => r.reportId === report.reportId);
            if (exists >= 0) {
            // Immer 방식: 직접 수정하면 Immer가 알아서 불변성을 유지하며 업데이트합니다.
            s.reports[exists] = report;
            } else {
            // Immer 방식: 직접 push 또는 unshift
            s.reports.unshift(report);
            }
            // Immer에서는 별도의 return 객체가 필요 없거나, 
            // 있어도 s를 직접 수정한 내용과 충돌하면 안 됩니다.
        }),

    clearReports: () =>
      set((s) => {
        s.reports = [];
      }),

    addMessage: (msg) =>
      set((s) => {
        s.messages.push(msg);
        if (s.messages.length > 300) s.messages = s.messages.slice(-300);
      }),

    clearMessages: () =>
      set((s) => {
        s.messages = [];
      }),

    setPendingFollowup: (agentId) =>
      set((s) => {
        s.pendingFollowupAgentId = agentId;
      }),

    setGenerating: (generating) =>
      set((s) => {
        s.isGenerating = generating;
      }),

    setExpandedReport: (reportId) =>
      set((s) => {
        s.expandedReportId = reportId;
      }),

    getReportsForTurn: (turn) => {
      return get().reports.filter((r) => r.turn === turn);
    },
  }))
);