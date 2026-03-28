import { create } from "zustand";
import type { GraphLegendState, GraphViewport, LogSource, SelectedEntity, UiLogEntry } from "@/types/ui";

const DEFAULT_VIEWPORT: GraphViewport = {
  zoom: 1.15,
  offsetX: 0,
  offsetY: 0,
};

const DEFAULT_LEGEND: GraphLegendState = {
  showGrid: true,
  showLabels: true,
  showRealEdges: true,
  showVirtualEdges: true,
  showHighlightedEdges: true,
  showSteinerEdges: true,
  showSteinerCities: true,
};

interface UiState {
  selectedEntity: SelectedEntity;
  isHelpOpen: boolean;
  logs: UiLogEntry[];
  viewport: GraphViewport;
  legend: GraphLegendState;
  selectCity: (cityId: number) => void;
  selectEdge: (selectedEdgeKey: string) => void;
  clearSelection: () => void;
  setHelpOpen: (open: boolean) => void;
  addLog: (entry: Omit<UiLogEntry, "id" | "createdAt">) => void;
  clearLogs: () => void;
  setViewport: (next: GraphViewport | ((current: GraphViewport) => GraphViewport)) => void;
  resetViewport: () => void;
  toggleLegend: (key: keyof GraphLegendState) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedEntity: { type: "none" },
  isHelpOpen: false,
  logs: [
    {
      id: crypto.randomUUID(),
      source: "system",
      level: "info",
      message: "工作台已就绪，等待加载图数据。",
      createdAt: new Date().toISOString(),
    },
  ],
  viewport: DEFAULT_VIEWPORT,
  legend: DEFAULT_LEGEND,
  selectCity: (cityId) => set({ selectedEntity: { type: "city", cityId } }),
  selectEdge: (selectedEdgeKey) => set({ selectedEntity: { type: "edge", edgeKey: selectedEdgeKey } }),
  clearSelection: () => set({ selectedEntity: { type: "none" } }),
  setHelpOpen: (open) => set({ isHelpOpen: open }),
  addLog: (entry) =>
    set((state) => ({
      logs: [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...entry,
        },
        ...state.logs,
      ].slice(0, 200),
    })),
  clearLogs: () => set({ logs: [] }),
  setViewport: (next) =>
    set((state) => ({
      viewport: typeof next === "function" ? next(state.viewport) : next,
    })),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),
  toggleLegend: (key) =>
    set((state) => ({
      legend: {
        ...state.legend,
        [key]: !state.legend[key],
      },
    })),
}));

export function createLogEntry(
  source: LogSource,
  message: string,
  level: UiLogEntry["level"] = "info",
): Omit<UiLogEntry, "id" | "createdAt"> {
  return {
    source,
    message,
    level,
  };
}
