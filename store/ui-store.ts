import { create } from "zustand";

export type TrackingState =
  | "idle"
  | "requestingPermission"
  | "tracking"
  | "permissionDenied"
  | "offline"
  | "syncing"
  | "error";

export type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type UiStore = {
  trackingEnabled: boolean;
  trackingState: TrackingState;
  trackingError: string | null;
  lastLocationSyncAt: string | null;
  toasts: ToastMessage[];
  setTrackingEnabled: (enabled: boolean) => void;
  setTrackingState: (state: TrackingState, error?: string | null) => void;
  setLastLocationSyncAt: (value: string | null) => void;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  trackingEnabled: false,
  trackingState: "idle",
  trackingError: null,
  lastLocationSyncAt: null,
  toasts: [],
  setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),
  setTrackingState: (state, error = null) => set({ trackingState: state, trackingError: error }),
  setLastLocationSyncAt: (value) => set({ lastLocationSyncAt: value }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: crypto.randomUUID()
        }
      ].slice(-4)
    })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));
