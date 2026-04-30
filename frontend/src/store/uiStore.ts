import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type ModalType =
  | "action"
  | "confirm_install"
  | "detailed_report"
  | "turn_timeout"
  | "game_end"
  | null;

interface UIStoreState {
  activeModal: ModalType;
  modalPayload: Record<string, unknown> | null;
  drawerOpen: boolean;
  drawerReportId: string | null;
  selectedZone: string | null;
  selectedSlot: number | null;
  isBroadcastPanelOpen: boolean;
  followupTargetId: string | null;
  notification: { message: string; level: "info" | "success" | "error" } | null;
  notificationTimeout: ReturnType<typeof setTimeout> | null;
}

interface UIStoreActions {
  openModal: (type: ModalType, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
  openDrawer: (reportId: string) => void;
  closeDrawer: () => void;
  selectZoneSlot: (zoneId: string | null, slotIndex: number | null) => void;
  toggleBroadcastPanel: () => void;
  setFollowupTarget: (agentId: string | null) => void;
  showNotification: (
    message: string,
    level?: "info" | "success" | "error"
  ) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIStoreState & UIStoreActions>()(
  immer((set, get) => ({
    activeModal: null,
    modalPayload: null,
    drawerOpen: false,
    drawerReportId: null,
    selectedZone: null,
    selectedSlot: null,
    isBroadcastPanelOpen: false,
    followupTargetId: null,
    notification: null,
    notificationTimeout: null,

    openModal: (type, payload) =>
      set((s) => {
        s.activeModal = type;
        s.modalPayload = payload ?? null;
      }),

    closeModal: () =>
      set((s) => {
        s.activeModal = null;
        s.modalPayload = null;
      }),

    openDrawer: (reportId) =>
      set((s) => {
        s.drawerOpen = true;
        s.drawerReportId = reportId;
      }),

    closeDrawer: () =>
      set((s) => {
        s.drawerOpen = false;
        s.drawerReportId = null;
      }),

    selectZoneSlot: (zoneId, slotIndex) =>
      set((s) => {
        s.selectedZone = zoneId;
        s.selectedSlot = slotIndex;
      }),

    toggleBroadcastPanel: () =>
      set((s) => {
        s.isBroadcastPanelOpen = !s.isBroadcastPanelOpen;
      }),

    setFollowupTarget: (agentId) =>
      set((s) => {
        s.followupTargetId = agentId;
      }),

    showNotification: (message, level = "info") => {
      const prev = get().notificationTimeout;
      if (prev) clearTimeout(prev);

      set((s) => {
        s.notification = { message, level };
      });

      const timeout = setTimeout(() => {
        set((s) => {
          s.notification = null;
          s.notificationTimeout = null;
        });
      }, 3500);

      set((s) => {
        s.notificationTimeout = timeout;
      });
    },

    clearNotification: () => {
      const prev = get().notificationTimeout;
      if (prev) clearTimeout(prev);

      set((s) => {
        s.notification = null;
        s.notificationTimeout = null;
      });
    },
  }))
);
