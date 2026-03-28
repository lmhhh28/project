import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/app/app";
import { EMPTY_GRAPH, type Graph } from "@/lib/api/types";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function mockApi(graph: Graph) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.endsWith("/graph") && method === "GET") {
      return Promise.resolve(
        createJsonResponse({
          success: true,
          message: "Graph fetched.",
          data: graph,
        }),
      );
    }

    if (url.endsWith("/health") && method === "GET") {
      return Promise.resolve(
        createJsonResponse({
          success: true,
          message: "Service is up.",
          data: {
            status: "UP",
            timestamp: "2026-03-28T11:17:11.001936Z",
          },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled request: ${method} ${url}`));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("WorkspacePage", () => {
  it("loads an empty graph and keeps algorithm actions disabled", async () => {
    mockApi(EMPTY_GRAPH);
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText(/当前图为空/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "算法控制台" }));

    expect(screen.getByRole("button", { name: /Q6 单源最短路径/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Q7 旅行商/i })).toBeDisabled();
  });

  it("opens the city editor when a city is selected on the canvas", async () => {
    mockApi({
      cities: [{ id: 1, name: "Beijing", x: 120, y: 220, description: "capital" }],
      edges: [],
      summary: {
        cityCount: 1,
        edgeCount: 0,
        realEdgeCount: 0,
        virtualEdgeCount: 0,
        steinerEdgeCount: 0,
      },
    });
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByText("1:Beijing"));

    expect(await screen.findByText("编辑城市 #1")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByDisplayValue("Beijing").length).toBeGreaterThan(0);
    });
  });
});
