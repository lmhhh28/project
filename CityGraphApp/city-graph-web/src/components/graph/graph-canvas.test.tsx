import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { EMPTY_GRAPH, type Graph } from "@/lib/api/types";
import type { GraphLegendState, GraphViewport } from "@/types/ui";

const SAMPLE_GRAPH: Graph = {
  cities: [
    { id: 1, name: "Beijing", x: 0, y: 0, description: "capital" },
    { id: 2, name: "Shanghai", x: 120, y: 0, description: "" },
    { id: 3, name: "Guangzhou", x: 60, y: 80, description: "" },
    { id: 4, name: "Steiner_4", x: 60, y: 30, description: "Auxiliary routing node" },
  ],
  edges: [
    { sourceId: 1, targetId: 2, length: 120, virtual: false, highlighted: false, steiner: false },
    { sourceId: 2, targetId: 3, length: 140, virtual: true, highlighted: false, steiner: false },
    { sourceId: 1, targetId: 3, length: 150, virtual: false, highlighted: true, steiner: false },
    { sourceId: 3, targetId: 4, length: 70, virtual: false, highlighted: false, steiner: true },
  ],
  summary: {
    cityCount: 4,
    edgeCount: 4,
    realEdgeCount: 1,
    virtualEdgeCount: 1,
    steinerEdgeCount: 1,
  },
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

const DEFAULT_VIEWPORT: GraphViewport = {
  zoom: 1.15,
  offsetX: 0,
  offsetY: 0,
};

describe("GraphCanvas", () => {
  it("renders graph labels and allows selecting a city", () => {
    const onSelectCity = vi.fn();

    render(
      <GraphCanvas
        graph={SAMPLE_GRAPH}
        selectedEntity={{ type: "none" }}
        legend={DEFAULT_LEGEND}
        viewport={DEFAULT_VIEWPORT}
        loading={false}
        onSelectCity={onSelectCity}
        onSelectEdge={vi.fn()}
        onClearSelection={vi.fn()}
        onViewportChange={vi.fn()}
        onResetViewport={vi.fn()}
        onToggleLegend={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("1:Beijing"));

    expect(onSelectCity).toHaveBeenCalledWith(1);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("3:Guangzhou")).toBeInTheDocument();
  });

  it("hides virtual and Steiner entities when legend toggles are off", () => {
    render(
      <GraphCanvas
        graph={SAMPLE_GRAPH}
        selectedEntity={{ type: "none" }}
        legend={{
          ...DEFAULT_LEGEND,
          showVirtualEdges: false,
          showSteinerEdges: false,
          showSteinerCities: false,
        }}
        viewport={DEFAULT_VIEWPORT}
        loading={false}
        onSelectCity={vi.fn()}
        onSelectEdge={vi.fn()}
        onClearSelection={vi.fn()}
        onViewportChange={vi.fn()}
        onResetViewport={vi.fn()}
        onToggleLegend={vi.fn()}
      />,
    );

    expect(screen.queryByText("Steiner")).not.toBeInTheDocument();
    expect(screen.queryByText("70")).not.toBeInTheDocument();
    expect(screen.queryByText("140")).not.toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("shows only empty state and no canvas interactions when graph is empty", () => {
    render(
      <GraphCanvas
        graph={EMPTY_GRAPH}
        selectedEntity={{ type: "none" }}
        legend={DEFAULT_LEGEND}
        viewport={DEFAULT_VIEWPORT}
        loading={false}
        onSelectCity={vi.fn()}
        onSelectEdge={vi.fn()}
        onClearSelection={vi.fn()}
        onViewportChange={vi.fn()}
        onResetViewport={vi.fn()}
        onToggleLegend={vi.fn()}
      />,
    );

    expect(screen.getByText(/当前图为空/)).toBeInTheDocument();
    expect(document.querySelector("svg.graph-svg")).not.toBeInTheDocument();
    expect(screen.queryByText("图统计")).not.toBeInTheDocument();
    expect(screen.queryByText("图层与视图")).not.toBeInTheDocument();
  });
});
