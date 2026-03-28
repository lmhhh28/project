import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlgorithmPanel } from "@/components/panels/algorithm-panel";
import { EMPTY_GRAPH, type Graph } from "@/lib/api/types";

const SAMPLE_GRAPH: Graph = {
  cities: [
    { id: 1, name: "Beijing", x: 0, y: 0, description: "" },
    { id: 2, name: "Shanghai", x: 100, y: 0, description: "" },
    { id: 3, name: "Shenzhen", x: 50, y: 90, description: "" },
  ],
  edges: [],
  summary: {
    cityCount: 3,
    edgeCount: 0,
    realEdgeCount: 0,
    virtualEdgeCount: 0,
    steinerEdgeCount: 0,
  },
};

describe("AlgorithmPanel", () => {
  it("disables actions that require unavailable graph data", () => {
    render(
      <AlgorithmPanel
        graph={EMPTY_GRAPH}
        pendingAction={null}
        onRunConnectivityFix={vi.fn()}
        onRunShortestPath={vi.fn()}
        onRunTsp={vi.fn()}
        onRunSteinerTree={vi.fn()}
        onClearHighlights={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Q5 连通性修复/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Q6 单源最短路径/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Q7 旅行商/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Q8 Steiner Tree/i })).toBeDisabled();
  });

  it("uses the selected city as default start point and forwards TSP options", async () => {
    const user = userEvent.setup();
    const onRunTsp = vi.fn().mockResolvedValue(undefined);

    render(
      <AlgorithmPanel
        graph={SAMPLE_GRAPH}
        selectedCity={SAMPLE_GRAPH.cities[1]}
        pendingAction={null}
        onRunConnectivityFix={vi.fn()}
        onRunShortestPath={vi.fn()}
        onRunTsp={onRunTsp}
        onRunSteinerTree={vi.fn()}
        onClearHighlights={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: /Q7 旅行商 最短路线/i }));

    expect(onRunTsp).toHaveBeenCalledWith(2, false);
  });
});
