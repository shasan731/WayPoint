import { create } from "zustand";

type MapStore = {
  center: [number, number];
  zoom: number;
  selectedConnectionId: string | null;
  sidebarOpen: boolean;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  selectConnection: (connectionId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useMapStore = create<MapStore>((set) => ({
  center: [39.8283, -98.5795],
  zoom: 4,
  selectedConnectionId: null,
  sidebarOpen: true,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  selectConnection: (selectedConnectionId) => set({ selectedConnectionId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen })
}));
