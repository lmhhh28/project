export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface City {
  id: number;
  name: string;
  x: number;
  y: number;
  description: string;
}

export interface Edge {
  sourceId: number;
  targetId: number;
  length: number;
  virtual: boolean;
  highlighted: boolean;
  steiner: boolean;
}

export interface GraphSummary {
  cityCount: number;
  edgeCount: number;
  realEdgeCount: number;
  virtualEdgeCount: number;
  steinerEdgeCount: number;
}

export interface Graph {
  cities: City[];
  edges: Edge[];
  summary: GraphSummary;
}

export type AlgorithmName =
  | "Q5_CONNECTIVITY_FIX"
  | "Q6_SHORTEST_PATH"
  | "Q7_TSP"
  | "Q8_STEINER_TREE";

export interface AlgorithmResult {
  algorithm: AlgorithmName;
  logs: string[];
  graph: Graph;
}

export interface ImportResult {
  warnings: string[];
  graph: Graph;
}

export interface HealthData {
  status: "UP" | string;
  timestamp: string;
}

export interface CreateCityPayload {
  id: number;
  name: string;
  x: number;
  y: number;
  description?: string;
}

export interface UpdateCityPayload {
  name: string;
  x: number;
  y: number;
  description?: string;
}

export interface CreateEdgePayload {
  sourceId: number;
  targetId: number;
}

export interface ShortestPathPayload {
  sourceId: number;
}

export interface TspPayload {
  startCityId: number;
  returnToStart: boolean;
}

export const EMPTY_GRAPH: Graph = {
  cities: [],
  edges: [],
  summary: {
    cityCount: 0,
    edgeCount: 0,
    realEdgeCount: 0,
    virtualEdgeCount: 0,
    steinerEdgeCount: 0,
  },
};
