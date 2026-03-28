export type SelectedEntity =
  | { type: "none" }
  | { type: "city"; cityId: number }
  | { type: "edge"; edgeKey: string };

export type LogSource = "system" | "graph" | "city" | "edge" | "algorithm" | "file";

export interface UiLogEntry {
  id: string;
  source: LogSource;
  level: "info" | "success" | "warning" | "error";
  message: string;
  createdAt: string;
}

export interface GraphViewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface GraphLegendState {
  showGrid: boolean;
  showLabels: boolean;
  showRealEdges: boolean;
  showVirtualEdges: boolean;
  showHighlightedEdges: boolean;
  showSteinerEdges: boolean;
  showSteinerCities: boolean;
}
