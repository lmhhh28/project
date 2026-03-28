import { useState } from "react";
import { App as AntdApp } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cityGraphApiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error";
import {
  EMPTY_GRAPH,
  type CreateCityPayload,
  type CreateEdgePayload,
  type Graph,
  type HealthData,
  type ShortestPathPayload,
  type TspPayload,
  type UpdateCityPayload,
} from "@/lib/api/types";
import { downloadTextFile } from "@/lib/download";
import { createLogEntry, useUiStore } from "@/store/ui-store";

const GRAPH_QUERY_KEY = ["graph"];
const HEALTH_QUERY_KEY = ["health"];

type PendingAction =
  | "refreshGraph"
  | "refreshHealth"
  | "addCity"
  | "updateCity"
  | "removeCity"
  | "addEdge"
  | "removeEdge"
  | "clearGraph"
  | "clearHighlights"
  | "importGraph"
  | "exportGraph"
  | "runConnectivityFix"
  | "runShortestPath"
  | "runTspPath"
  | "runTspCycle"
  | "runSteinerTree";

export function useCityGraphWorkspace() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const addLog = useUiStore((state) => state.addLog);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [latestImportWarnings, setLatestImportWarnings] = useState<string[]>([]);

  const graphQuery = useQuery({
    queryKey: GRAPH_QUERY_KEY,
    queryFn: async () => {
      const response = await cityGraphApiClient.getGraph();
      return response.data ?? EMPTY_GRAPH;
    },
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  const healthQuery = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: async () => {
      const response = await cityGraphApiClient.getHealth();
      return response.data ?? {
        status: "DOWN",
        timestamp: new Date().toISOString(),
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const reportError = (source: "graph" | "city" | "edge" | "algorithm" | "file" | "system", error: unknown) => {
    const errorMessage = getErrorMessage(error);
    message.error(errorMessage);
    addLog(createLogEntry(source, errorMessage, "error"));
  };

  const setGraph = (graph: Graph) => {
    queryClient.setQueryData(GRAPH_QUERY_KEY, graph);
  };

  const withPending = async <T>(action: PendingAction, runner: () => Promise<T>) => {
    setPendingAction(action);

    try {
      return await runner();
    } finally {
      setPendingAction((current) => (current === action ? null : current));
    }
  };

  const refreshGraph = async () =>
    withPending("refreshGraph", async () => {
      try {
        const response = await cityGraphApiClient.getGraph();
        const graph = response.data ?? EMPTY_GRAPH;
        setGraph(graph);
        addLog(createLogEntry("graph", response.message, "success"));
        return graph;
      } catch (error) {
        reportError("graph", error);
        throw error;
      }
    });

  const refreshHealth = async () =>
    withPending("refreshHealth", async () => {
      try {
        const response = await cityGraphApiClient.getHealth();
        queryClient.setQueryData<HealthData | null>(HEALTH_QUERY_KEY, response.data ?? null);
        addLog(createLogEntry("system", "健康检查已刷新。", "info"));
      } catch (error) {
        reportError("system", error);
        throw error;
      }
    });

  const addCity = async (payload: CreateCityPayload) =>
    withPending("addCity", async () => {
      try {
        const response = await cityGraphApiClient.addCity(payload);
        setGraph(response.data ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("city", response.message, "success"));
      } catch (error) {
        reportError("city", error);
        throw error;
      }
    });

  const updateCity = async (cityId: number, payload: UpdateCityPayload) =>
    withPending("updateCity", async () => {
      try {
        const response = await cityGraphApiClient.updateCity(cityId, payload);
        setGraph(response.data ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("city", response.message, "success"));
      } catch (error) {
        reportError("city", error);
        throw error;
      }
    });

  const removeCity = async (cityId: number) =>
    withPending("removeCity", async () => {
      try {
        const response = await cityGraphApiClient.removeCity(cityId);
        setGraph(response.data ?? EMPTY_GRAPH);
        clearSelection();
        message.success(response.message);
        addLog(createLogEntry("city", response.message, "warning"));
      } catch (error) {
        reportError("city", error);
        throw error;
      }
    });

  const addEdge = async (payload: CreateEdgePayload) =>
    withPending("addEdge", async () => {
      try {
        const response = await cityGraphApiClient.addEdge(payload);
        setGraph(response.data ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("edge", response.message, "success"));
      } catch (error) {
        reportError("edge", error);
        throw error;
      }
    });

  const removeEdge = async (sourceId: number, targetId: number) =>
    withPending("removeEdge", async () => {
      try {
        const response = await cityGraphApiClient.removeEdge(sourceId, targetId);
        setGraph(response.data ?? EMPTY_GRAPH);
        clearSelection();
        message.success(response.message);
        addLog(createLogEntry("edge", response.message, "warning"));
      } catch (error) {
        reportError("edge", error);
        throw error;
      }
    });

  const clearGraph = async () =>
    withPending("clearGraph", async () => {
      try {
        const response = await cityGraphApiClient.clearGraph();
        setGraph(response.data ?? EMPTY_GRAPH);
        clearSelection();
        message.success(response.message);
        addLog(createLogEntry("graph", response.message, "warning"));
      } catch (error) {
        reportError("graph", error);
        throw error;
      }
    });

  const clearHighlights = async () =>
    withPending("clearHighlights", async () => {
      try {
        const response = await cityGraphApiClient.clearHighlights();
        setGraph(response.data ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("algorithm", response.message, "info"));
      } catch (error) {
        reportError("algorithm", error);
        throw error;
      }
    });

  const importGraph = async (file: File) =>
    withPending("importGraph", async () => {
      try {
        const response = await cityGraphApiClient.importGraph(file);
        const nextGraph = response.data?.graph ?? EMPTY_GRAPH;
        setGraph(nextGraph);
        clearSelection();
        const warnings = response.data?.warnings ?? [];
        setLatestImportWarnings(warnings);
        message.success(response.message);
        addLog(createLogEntry("file", `${response.message} 文件：${file.name}`, "success"));
        warnings.forEach((warning) => addLog(createLogEntry("file", warning, "warning")));
      } catch (error) {
        reportError("file", error);
        throw error;
      }
    });

  const exportGraph = async () =>
    withPending("exportGraph", async () => {
      try {
        const content = await cityGraphApiClient.exportGraphText();
        downloadTextFile("city-graph.txt", content);
        message.success("图谱已导出。");
        addLog(createLogEntry("file", "已导出 city-graph.txt", "success"));
      } catch (error) {
        reportError("file", error);
        throw error;
      }
    });

  const runConnectivityFix = async () =>
    withPending("runConnectivityFix", async () => {
      try {
        const response = await cityGraphApiClient.runConnectivityFix();
        const result = response.data;
        setGraph(result?.graph ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("algorithm", result?.algorithm ?? response.message, "success"));
        result?.logs.forEach((logLine) => addLog(createLogEntry("algorithm", logLine, "info")));
      } catch (error) {
        reportError("algorithm", error);
        throw error;
      }
    });

  const runShortestPath = async (payload: ShortestPathPayload) =>
    withPending("runShortestPath", async () => {
      try {
        const response = await cityGraphApiClient.runShortestPath(payload);
        const result = response.data;
        setGraph(result?.graph ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("algorithm", result?.algorithm ?? response.message, "success"));
        result?.logs.forEach((logLine) => addLog(createLogEntry("algorithm", logLine, "info")));
      } catch (error) {
        reportError("algorithm", error);
        throw error;
      }
    });

  const runTsp = async (payload: TspPayload) =>
    withPending(payload.returnToStart ? "runTspCycle" : "runTspPath", async () => {
      try {
        const response = await cityGraphApiClient.runTsp(payload);
        const result = response.data;
        setGraph(result?.graph ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("algorithm", result?.algorithm ?? response.message, "success"));
        result?.logs.forEach((logLine) => addLog(createLogEntry("algorithm", logLine, "info")));
      } catch (error) {
        reportError("algorithm", error);
        throw error;
      }
    });

  const runSteinerTree = async () =>
    withPending("runSteinerTree", async () => {
      try {
        const response = await cityGraphApiClient.runSteinerTree();
        const result = response.data;
        setGraph(result?.graph ?? EMPTY_GRAPH);
        message.success(response.message);
        addLog(createLogEntry("algorithm", result?.algorithm ?? response.message, "success"));
        result?.logs.forEach((logLine) => addLog(createLogEntry("algorithm", logLine, "info")));
      } catch (error) {
        reportError("algorithm", error);
        throw error;
      }
    });

  return {
    apiBaseUrl: cityGraphApiClient.getBaseUrl(),
    graph: graphQuery.data ?? EMPTY_GRAPH,
    graphQuery,
    health: healthQuery.data,
    healthQuery,
    latestImportWarnings,
    pendingAction,
    refreshGraph,
    refreshHealth,
    addCity,
    updateCity,
    removeCity,
    addEdge,
    removeEdge,
    clearGraph,
    clearHighlights,
    importGraph,
    exportGraph,
    runConnectivityFix,
    runShortestPath,
    runTsp,
    runSteinerTree,
  };
}
