import type {
  AlgorithmResult,
  ApiResponse,
  CreateCityPayload,
  CreateEdgePayload,
  Graph,
  HealthData,
  ImportResult,
  ShortestPathPayload,
  TspPayload,
  UpdateCityPayload,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor(status: number, message: string, responseBody: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export class CityGraphApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://localhost:8080/api/v1") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  getHealth(): Promise<ApiResponse<HealthData>> {
    return this.requestJson<HealthData>("/health", { method: "GET" });
  }

  getGraph(): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>("/graph", { method: "GET" });
  }

  clearGraph(): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>("/graph", { method: "DELETE" });
  }

  clearHighlights(): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>("/graph/clear-highlights", { method: "POST" });
  }

  addCity(payload: CreateCityPayload): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>("/graph/cities", {
      method: "POST",
      body: payload,
    });
  }

  updateCity(cityId: number, payload: UpdateCityPayload): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>(`/graph/cities/${cityId}`, {
      method: "PUT",
      body: payload,
    });
  }

  removeCity(cityId: number): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>(`/graph/cities/${cityId}`, {
      method: "DELETE",
    });
  }

  addEdge(payload: CreateEdgePayload): Promise<ApiResponse<Graph>> {
    return this.requestJson<Graph>("/graph/edges", {
      method: "POST",
      body: payload,
    });
  }

  removeEdge(sourceId: number, targetId: number): Promise<ApiResponse<Graph>> {
    const query = new URLSearchParams({
      sourceId: String(sourceId),
      targetId: String(targetId),
    });
    return this.requestJson<Graph>(`/graph/edges?${query.toString()}`, {
      method: "DELETE",
    });
  }

  importGraph(file: File): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append("file", file);

    return this.requestJson<ImportResult>("/graph/import", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  }

  exportGraphText(): Promise<string> {
    return this.requestText("/graph/export", { method: "GET" });
  }

  runConnectivityFix(): Promise<ApiResponse<AlgorithmResult>> {
    return this.requestJson<AlgorithmResult>("/algorithms/connectivity-fix", {
      method: "POST",
    });
  }

  runShortestPath(payload: ShortestPathPayload): Promise<ApiResponse<AlgorithmResult>> {
    return this.requestJson<AlgorithmResult>("/algorithms/shortest-path", {
      method: "POST",
      body: payload,
    });
  }

  runTsp(payload: TspPayload): Promise<ApiResponse<AlgorithmResult>> {
    return this.requestJson<AlgorithmResult>("/algorithms/tsp", {
      method: "POST",
      body: payload,
    });
  }

  runSteinerTree(): Promise<ApiResponse<AlgorithmResult>> {
    return this.requestJson<AlgorithmResult>("/algorithms/steiner-tree", {
      method: "POST",
    });
  }

  private async requestJson<T>(
    path: string,
    options: {
      method: string;
      body?: unknown;
      isFormData?: boolean;
    },
  ): Promise<ApiResponse<T>> {
    const headers = new Headers();

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      if (options.isFormData) {
        body = options.body as FormData;
      } else {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers,
      body,
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}`;
      const message =
        responseBody && typeof responseBody === "object" && "message" in responseBody
          ? String((responseBody as { message: unknown }).message)
          : fallbackMessage;
      throw new ApiError(response.status, message, responseBody);
    }

    return responseBody as ApiResponse<T>;
  }

  private async requestText(
    path: string,
    options: {
      method: string;
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new ApiError(response.status, text || `HTTP ${response.status}`, text);
    }

    return text;
  }
}
