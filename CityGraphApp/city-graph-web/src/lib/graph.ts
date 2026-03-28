import type { City, Edge, Graph } from "@/lib/api/types";

export function edgeKey(sourceId: number, targetId: number): string {
  const [minId, maxId] = [sourceId, targetId].sort((left, right) => left - right);
  return `${minId}-${maxId}`;
}

export function isSteinerCity(city: City): boolean {
  return city.name.startsWith("Steiner_");
}

export function getEdgeVariant(edge: Edge): "highlighted" | "virtual" | "steiner" | "real" {
  if (edge.highlighted) {
    return "highlighted";
  }
  if (edge.virtual) {
    return "virtual";
  }
  if (edge.steiner) {
    return "steiner";
  }
  return "real";
}

export function getGraphBounds(graph: Graph): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (graph.cities.length === 0) {
    return {
      minX: -300,
      maxX: 300,
      minY: -220,
      maxY: 220,
    };
  }

  return graph.cities.reduce(
    (bounds, city) => ({
      minX: Math.min(bounds.minX, city.x),
      maxX: Math.max(bounds.maxX, city.x),
      minY: Math.min(bounds.minY, city.y),
      maxY: Math.max(bounds.maxY, city.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

export function getCityById(graph: Graph, cityId: number | undefined): City | undefined {
  return graph.cities.find((city) => city.id === cityId);
}

export function getEdgeByKey(graph: Graph, selectedEdgeKey: string | undefined): Edge | undefined {
  return graph.edges.find((edge) => edgeKey(edge.sourceId, edge.targetId) === selectedEdgeKey);
}
