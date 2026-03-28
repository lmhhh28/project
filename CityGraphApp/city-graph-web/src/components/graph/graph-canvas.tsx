import { useEffect, useRef, useState } from "react";
import { Empty, Spin, Typography } from "antd";
import type { Graph } from "@/lib/api/types";
import { getCityById, getEdgeVariant, getGraphBounds, isSteinerCity } from "@/lib/graph";
import { useElementSize } from "@/hooks/use-element-size";
import { edgeKey } from "@/lib/graph";
import { GraphLegend } from "@/components/graph/graph-legend";
import { GraphStats } from "@/components/graph/graph-stats";
import type { GraphLegendState, GraphViewport, SelectedEntity } from "@/types/ui";

type TextAnchor = "start" | "middle" | "end";

interface LabelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LabelPlacement {
  textX: number;
  textY: number;
  anchor: TextAnchor;
  rect: LabelRect;
}

interface VisibleCityLayout {
  city: Graph["cities"][number];
  x: number;
  y: number;
  steinerCity: boolean;
}

interface VisibleEdgeLayout {
  edge: Graph["edges"][number];
  source: VisibleCityLayout;
  target: VisibleCityLayout;
  variant: ReturnType<typeof getEdgeVariant>;
}

interface GraphCanvasProps {
  graph: Graph;
  selectedEntity: SelectedEntity;
  legend: GraphLegendState;
  viewport: GraphViewport;
  loading: boolean;
  onSelectCity: (cityId: number) => void;
  onSelectEdge: (selectedEdgeKey: string) => void;
  onClearSelection: () => void;
  onViewportChange: (next: GraphViewport | ((current: GraphViewport) => GraphViewport)) => void;
  onResetViewport: () => void;
  onToggleLegend: (key: keyof GraphLegendState) => void;
}

const CITY_LABEL_FONT_SIZE = 12;
const EDGE_LABEL_FONT_SIZE = 12;

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(fontSize * 2, Math.ceil(text.length * fontSize * 0.68));
}

function buildLabelRect(textX: number, textY: number, width: number, height: number, anchor: TextAnchor): LabelRect {
  if (anchor === "start") {
    return {
      x: textX - 6,
      y: textY - height / 2 - 2,
      width: width + 12,
      height: height + 4,
    };
  }

  if (anchor === "end") {
    return {
      x: textX - width - 6,
      y: textY - height / 2 - 2,
      width: width + 12,
      height: height + 4,
    };
  }

  return {
    x: textX - width / 2 - 6,
    y: textY - height / 2 - 2,
    width: width + 12,
    height: height + 4,
  };
}

function rectCenter(rect: LabelRect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function rectsOverlap(left: LabelRect, right: LabelRect, padding = 6) {
  return !(
    left.x + left.width + padding < right.x ||
    right.x + right.width + padding < left.x ||
    left.y + left.height + padding < right.y ||
    right.y + right.height + padding < left.y
  );
}

function pointInsideExpandedRect(rect: LabelRect, x: number, y: number, padding = 0) {
  return (
    x >= rect.x - padding &&
    x <= rect.x + rect.width + padding &&
    y >= rect.y - padding &&
    y <= rect.y + rect.height + padding
  );
}

function overflowPenalty(rect: LabelRect, width: number, height: number, padding = 12) {
  let penalty = 0;

  if (rect.x < padding) {
    penalty += (padding - rect.x) * 48;
  }
  if (rect.y < padding) {
    penalty += (padding - rect.y) * 48;
  }
  if (rect.x + rect.width > width - padding) {
    penalty += (rect.x + rect.width - (width - padding)) * 48;
  }
  if (rect.y + rect.height > height - padding) {
    penalty += (rect.y + rect.height - (height - padding)) * 48;
  }

  return penalty;
}

function distanceToSegmentSquared(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const dx = endX - startX;
  const dy = endY - startY;

  if (dx === 0 && dy === 0) {
    return (pointX - startX) ** 2 + (pointY - startY) ** 2;
  }

  const t = Math.max(0, Math.min(1, ((pointX - startX) * dx + (pointY - startY) * dy) / (dx * dx + dy * dy)));
  const projectedX = startX + t * dx;
  const projectedY = startY + t * dy;
  return (pointX - projectedX) ** 2 + (pointY - projectedY) ** 2;
}

function chooseCityLabelPlacement(
  layout: VisibleCityLayout,
  allCities: VisibleCityLayout[],
  visibleEdges: VisibleEdgeLayout[],
  width: number,
  height: number,
) {
  const labelText = `${layout.city.id}:${layout.steinerCity ? "Steiner" : layout.city.name}`;
  const labelWidth = estimateTextWidth(labelText, CITY_LABEL_FONT_SIZE);
  const labelHeight = 16;
  const radius = layout.steinerCity ? 9 : 12;
  const gapX = radius + 10;
  const gapY = radius + 12;
  const incidentEdges = visibleEdges.filter(
    ({ edge }) => edge.sourceId === layout.city.id || edge.targetId === layout.city.id,
  );

  const candidates: Array<Pick<LabelPlacement, "textX" | "textY" | "anchor">> = [
    { textX: layout.x + gapX, textY: layout.y - gapY, anchor: "start" },
    { textX: layout.x - gapX, textY: layout.y - gapY, anchor: "end" },
    { textX: layout.x + gapX, textY: layout.y + gapY, anchor: "start" },
    { textX: layout.x - gapX, textY: layout.y + gapY, anchor: "end" },
  ];

  let bestPlacement: LabelPlacement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const rect = buildLabelRect(candidate.textX, candidate.textY, labelWidth, labelHeight, candidate.anchor);
    const rectMidpoint = rectCenter(rect);
    let score = overflowPenalty(rect, width, height);

    for (const otherCity of allCities) {
      if (otherCity.city.id === layout.city.id) {
        continue;
      }
      if (pointInsideExpandedRect(rect, otherCity.x, otherCity.y, 18)) {
        score += 1200;
      }
    }

    for (const visibleEdge of visibleEdges) {
      const edgeTouchesCurrent =
        visibleEdge.edge.sourceId === layout.city.id || visibleEdge.edge.targetId === layout.city.id;
      const distance = distanceToSegmentSquared(
        rectMidpoint.x,
        rectMidpoint.y,
        visibleEdge.source.x,
        visibleEdge.source.y,
        visibleEdge.target.x,
        visibleEdge.target.y,
      );

      if (distance < (edgeTouchesCurrent ? 22 : 16) ** 2) {
        score += edgeTouchesCurrent ? 520 : 720;
      }
    }

    for (const incidentEdge of incidentEdges) {
      const otherCity =
        incidentEdge.edge.sourceId === layout.city.id ? incidentEdge.target : incidentEdge.source;
      const vectorToEdgeX = otherCity.x - layout.x;
      const vectorToEdgeY = otherCity.y - layout.y;
      const vectorToLabelX = rectMidpoint.x - layout.x;
      const vectorToLabelY = rectMidpoint.y - layout.y;
      const edgeLength = Math.hypot(vectorToEdgeX, vectorToEdgeY);
      const labelLength = Math.hypot(vectorToLabelX, vectorToLabelY);

      if (edgeLength === 0 || labelLength === 0) {
        continue;
      }

      const cosine = (vectorToEdgeX * vectorToLabelX + vectorToEdgeY * vectorToLabelY) / (edgeLength * labelLength);
      if (cosine > 0.72) {
        score += 420 * cosine;
      }
    }

    if (score < bestScore) {
      bestScore = score;
      bestPlacement = {
        ...candidate,
        rect,
      };
    }
  }

  return bestPlacement;
}

function chooseEdgeLabelPlacement(
  edgeLayout: VisibleEdgeLayout,
  width: number,
  height: number,
  cityPlacements: LabelPlacement[],
  placedEdgeLabels: LabelPlacement[],
  cityLayouts: VisibleCityLayout[],
) {
  const dx = edgeLayout.target.x - edgeLayout.source.x;
  const dy = edgeLayout.target.y - edgeLayout.source.y;
  const lineLength = Math.hypot(dx, dy) || 1;
  const normalX = -dy / lineLength;
  const normalY = dx / lineLength;
  const midX = (edgeLayout.source.x + edgeLayout.target.x) / 2;
  const midY = (edgeLayout.source.y + edgeLayout.target.y) / 2;
  const labelWidth = estimateTextWidth(String(edgeLayout.edge.length), EDGE_LABEL_FONT_SIZE);
  const labelHeight = 16;
  const offset = 18;
  const candidates: Array<Pick<LabelPlacement, "textX" | "textY" | "anchor">> = [
    { textX: midX + normalX * offset, textY: midY + normalY * offset, anchor: "middle" },
    { textX: midX - normalX * offset, textY: midY - normalY * offset, anchor: "middle" },
  ];

  let bestPlacement: LabelPlacement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const rect = buildLabelRect(candidate.textX, candidate.textY, labelWidth, labelHeight, candidate.anchor);
    const rectMidpoint = rectCenter(rect);
    let score = overflowPenalty(rect, width, height);

    const distanceToLine = distanceToSegmentSquared(
      rectMidpoint.x,
      rectMidpoint.y,
      edgeLayout.source.x,
      edgeLayout.source.y,
      edgeLayout.target.x,
      edgeLayout.target.y,
    );
    if (distanceToLine < 16 ** 2) {
      score += 480;
    }

    for (const cityLayout of cityLayouts) {
      if (pointInsideExpandedRect(rect, cityLayout.x, cityLayout.y, 16)) {
        score += 840;
      }
    }

    for (const cityPlacement of cityPlacements) {
      if (rectsOverlap(rect, cityPlacement.rect, 4)) {
        score += 940;
      }
    }

    for (const edgePlacement of placedEdgeLabels) {
      if (rectsOverlap(rect, edgePlacement.rect, 4)) {
        score += 940;
      }
    }

    if (score < bestScore) {
      bestScore = score;
      bestPlacement = {
        ...candidate,
        rect,
      };
    }
  }

  return bestPlacement;
}

export function GraphCanvas({
  graph,
  selectedEntity,
  legend,
  viewport,
  loading,
  onSelectCity,
  onSelectEdge,
  onClearSelection,
  onViewportChange,
  onResetViewport,
  onToggleLegend,
}: GraphCanvasProps) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const hasRenderableGraph = graph.cities.length > 0 || graph.edges.length > 0;

  const screenX = (x: number) => width / 2 + viewport.offsetX + x * viewport.zoom;
  const screenY = (y: number) => height / 2 + viewport.offsetY - y * viewport.zoom;
  const visibleMinX = (-width / 2 - viewport.offsetX) / viewport.zoom;
  const visibleMaxX = (width / 2 - viewport.offsetX) / viewport.zoom;
  const visibleMinY = (-height / 2 + viewport.offsetY) / viewport.zoom;
  const visibleMaxY = (height / 2 + viewport.offsetY) / viewport.zoom;

  useEffect(() => {
    const container = ref.current;
    if (!container || !hasRenderableGraph) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (!width || !height) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const zoomDelta = event.deltaY > 0 ? -0.08 : 0.08;

      onViewportChange((current) => {
        const nextZoom = Math.min(3.2, Math.max(0.45, current.zoom + zoomDelta));
        const worldX = (localX - width / 2 - current.offsetX) / current.zoom;
        const worldY = (height / 2 + current.offsetY - localY) / current.zoom;

        return {
          zoom: nextZoom,
          offsetX: localX - width / 2 - worldX * nextZoom,
          offsetY: localY - height / 2 + worldY * nextZoom,
        };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [hasRenderableGraph, height, onViewportChange, ref, width]);

  const shouldShowEdge = (variant: ReturnType<typeof getEdgeVariant>) => {
    if (variant === "highlighted") {
      return legend.showHighlightedEdges;
    }
    if (variant === "virtual") {
      return legend.showVirtualEdges;
    }
    if (variant === "steiner") {
      return legend.showSteinerEdges;
    }
    return legend.showRealEdges;
  };

  const visibleCityLayouts = graph.cities
    .map((city) => ({
      city,
      x: screenX(city.x),
      y: screenY(city.y),
      steinerCity: isSteinerCity(city),
    }))
    .filter((layout) => !layout.steinerCity || legend.showSteinerCities);

  const visibleCityMap = new Map(visibleCityLayouts.map((layout) => [layout.city.id, layout]));

  const visibleEdgeLayouts = graph.edges
    .map((edge) => {
      const source = visibleCityMap.get(edge.sourceId);
      const target = visibleCityMap.get(edge.targetId);

      if (!source || !target) {
        return null;
      }

      const variant = getEdgeVariant(edge);
      if (!shouldShowEdge(variant)) {
        return null;
      }

      return {
        edge,
        source,
        target,
        variant,
      } satisfies VisibleEdgeLayout;
    })
    .filter((edgeLayout): edgeLayout is VisibleEdgeLayout => edgeLayout !== null);

  const cityLabelPlacements = legend.showLabels
    ? visibleCityLayouts.map((layout) => ({
        cityId: layout.city.id,
        placement: chooseCityLabelPlacement(layout, visibleCityLayouts, visibleEdgeLayouts, width, height),
        label: `${layout.city.id}:${layout.steinerCity ? "Steiner" : layout.city.name}`,
      }))
    : [];

  const cityPlacementMap = new Map(
    cityLabelPlacements
      .filter((entry): entry is { cityId: number; placement: LabelPlacement; label: string } => entry.placement !== null)
      .map((entry) => [entry.cityId, entry]),
  );

  const placedEdgeLabelRects: LabelPlacement[] = [];
  const edgeLabelPlacements = legend.showLabels
    ? visibleEdgeLayouts.map((edgeLayout) => {
        const placement = chooseEdgeLabelPlacement(
          edgeLayout,
          width,
          height,
          Array.from(cityPlacementMap.values()).map((entry) => entry.placement),
          placedEdgeLabelRects,
          visibleCityLayouts,
        );
        if (placement) {
          placedEdgeLabelRects.push(placement);
        }
        return {
          edgeKey: edgeKey(edgeLayout.edge.sourceId, edgeLayout.edge.targetId),
          placement,
        };
      })
    : [];

  const edgePlacementMap = new Map(
    edgeLabelPlacements
      .filter((entry): entry is { edgeKey: string; placement: LabelPlacement } => entry.placement !== null)
      .map((entry) => [entry.edgeKey, entry.placement]),
  );

  const fitViewport = () => {
    if (!width || !height) {
      return;
    }

    const bounds = getGraphBounds(graph);
    const spanX = Math.max(bounds.maxX - bounds.minX, 160);
    const spanY = Math.max(bounds.maxY - bounds.minY, 160);
    const paddingX = 180;
    const paddingY = 180;
    const nextZoom = Math.max(0.55, Math.min((width - paddingX) / spanX, (height - paddingY) / spanY, 2.4));
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    onViewportChange({
      zoom: nextZoom,
      offsetX: -centerX * nextZoom,
      offsetY: centerY * nextZoom,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!hasRenderableGraph) {
      return;
    }

    if ((event.target as HTMLElement).closest("[data-entity='city'], [data-entity='edge']")) {
      return;
    }

    dragRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!hasRenderableGraph) {
      return;
    }

    if (!dragRef.current) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };

    onViewportChange((current) => ({
      ...current,
      offsetX: current.offsetX + deltaX,
      offsetY: current.offsetY + deltaY,
    }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const gridLines: React.ReactNode[] = [];
  if (legend.showGrid && width > 0 && height > 0) {
    const startX = Math.floor(visibleMinX / 50) * 50;
    const endX = Math.ceil(visibleMaxX / 50) * 50;
    const startY = Math.floor(visibleMinY / 50) * 50;
    const endY = Math.ceil(visibleMaxY / 50) * 50;

    for (let x = startX; x <= endX; x += 50) {
      gridLines.push(
        <line
          key={`grid-x-${x}`}
          x1={screenX(x)}
          x2={screenX(x)}
          y1={0}
          y2={height}
          stroke={x === 0 ? "rgba(20, 33, 61, 0.22)" : "rgba(20, 33, 61, 0.08)"}
          strokeWidth={x === 0 ? 1.6 : 1}
        />,
      );
    }

    for (let y = startY; y <= endY; y += 50) {
      gridLines.push(
        <line
          key={`grid-y-${y}`}
          x1={0}
          x2={width}
          y1={screenY(y)}
          y2={screenY(y)}
          stroke={y === 0 ? "rgba(20, 33, 61, 0.22)" : "rgba(20, 33, 61, 0.08)"}
          strokeWidth={y === 0 ? 1.6 : 1}
        />,
      );
    }
  }

  return (
    <div className="canvas-shell">
      {!loading && hasRenderableGraph ? (
        <>
          <div className="graph-overlay graph-overlay--stats">
            <GraphStats
              summary={graph.summary}
              collapsed={statsCollapsed}
              onToggleCollapse={() => setStatsCollapsed((current) => !current)}
            />
          </div>

          <div className="graph-overlay graph-overlay--legend">
            <GraphLegend
              legend={legend}
              collapsed={legendCollapsed}
              onToggle={onToggleLegend}
              onToggleCollapse={() => setLegendCollapsed((current) => !current)}
              onResetViewport={onResetViewport}
              onFitViewport={fitViewport}
            />
          </div>
        </>
      ) : null}

      <div ref={ref} className="canvas-container">
        {loading ? (
          <div className="graph-empty">
            <Spin size="large" />
          </div>
        ) : null}

        {!hasRenderableGraph && !loading ? (
          <div className="graph-empty">
            <Empty
              description={
                <Typography.Text type="secondary">
                  当前图为空。先在右侧添加城市或导入 TXT，再运行算法。
                </Typography.Text>
              }
            />
          </div>
        ) : null}

        {hasRenderableGraph ? (
          <svg
            className={`graph-svg${isDragging ? " is-dragging" : ""}`}
            viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                onClearSelection();
              }
            }}
          >
            <g>{gridLines}</g>

            <g>
              {graph.edges.map((edge) => {
                const source = getCityById(graph, edge.sourceId);
                const target = getCityById(graph, edge.targetId);

                if (!source || !target) {
                  return null;
                }

                if (!legend.showSteinerCities && (isSteinerCity(source) || isSteinerCity(target))) {
                  return null;
                }

                const variant = getEdgeVariant(edge);
                if (!shouldShowEdge(variant)) {
                  return null;
                }

                const isSelected =
                  selectedEntity.type === "edge" && selectedEntity.edgeKey === edgeKey(edge.sourceId, edge.targetId);
                const x1 = screenX(source.x);
                const y1 = screenY(source.y);
                const x2 = screenX(target.x);
                const y2 = screenY(target.y);
                const stroke =
                  variant === "highlighted"
                    ? "#d4380d"
                    : variant === "virtual"
                      ? "#1677ff"
                      : variant === "steiner"
                        ? "#d48806"
                        : "#5c6b8a";
                const strokeDasharray = variant === "virtual" ? "10 8" : variant === "steiner" ? "7 6" : undefined;
                const strokeWidth = isSelected ? 4.5 : variant === "highlighted" ? 3.5 : 2;
                const labelPlacement = edgePlacementMap.get(edgeKey(edge.sourceId, edge.targetId));

                return (
                  <g key={edgeKey(edge.sourceId, edge.targetId)}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                    />
                    <line
                      data-entity="edge"
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={16}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEdge(edgeKey(edge.sourceId, edge.targetId));
                      }}
                    />
                    {legend.showLabels && labelPlacement ? (
                      <g>
                        <rect
                          x={labelPlacement.rect.x}
                          y={labelPlacement.rect.y}
                          width={labelPlacement.rect.width}
                          height={labelPlacement.rect.height}
                          rx={8}
                          fill="rgba(255, 255, 255, 0.84)"
                          stroke="rgba(148, 163, 184, 0.45)"
                          strokeWidth={1}
                        />
                        <text
                          x={labelPlacement.textX}
                          y={labelPlacement.textY}
                          textAnchor={labelPlacement.anchor}
                          dominantBaseline="middle"
                          fontSize={EDGE_LABEL_FONT_SIZE}
                          fill="#334155"
                          style={{ userSelect: "none", pointerEvents: "none" }}
                        >
                          {edge.length}
                        </text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>

            <g>
              {graph.cities.map((city) => {
                const steinerCity = isSteinerCity(city);
                if (steinerCity && !legend.showSteinerCities) {
                  return null;
                }

                const isSelected = selectedEntity.type === "city" && selectedEntity.cityId === city.id;
                const x = screenX(city.x);
                const y = screenY(city.y);
                const labelPlacement = cityPlacementMap.get(city.id);

                return (
                  <g
                    key={city.id}
                    data-entity="city"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectCity(city.id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {steinerCity ? (
                      <rect
                        x={x - 7}
                        y={y - 7}
                        width={14}
                        height={14}
                        rx={3}
                        fill={isSelected ? "#faad14" : "#ffa940"}
                        stroke="#ad6800"
                        strokeWidth={isSelected ? 3 : 1.5}
                      />
                    ) : (
                      <>
                        <circle cx={x} cy={y} r={isSelected ? 14 : 11} fill="rgba(22, 119, 255, 0.16)" />
                        <circle
                          cx={x}
                          cy={y}
                          r={10}
                          fill={isSelected ? "#0958d9" : "#1677ff"}
                          stroke="#102a56"
                          strokeWidth={1.5}
                        />
                      </>
                    )}

                    {legend.showLabels && labelPlacement ? (
                      <g>
                        <rect
                          x={labelPlacement.placement.rect.x}
                          y={labelPlacement.placement.rect.y}
                          width={labelPlacement.placement.rect.width}
                          height={labelPlacement.placement.rect.height}
                          rx={8}
                          fill="rgba(255, 255, 255, 0.88)"
                          stroke={isSelected ? "rgba(22, 119, 255, 0.48)" : "rgba(148, 163, 184, 0.4)"}
                          strokeWidth={1}
                        />
                        <text
                          x={labelPlacement.placement.textX}
                          y={labelPlacement.placement.textY}
                          textAnchor={labelPlacement.placement.anchor}
                          dominantBaseline="middle"
                          fontSize={CITY_LABEL_FONT_SIZE}
                          fill="#102a56"
                          style={{ userSelect: "none" }}
                        >
                          {labelPlacement.label}
                        </text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>
        ) : null}
      </div>
    </div>
  );
}
