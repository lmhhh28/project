import { Card, Statistic } from "antd";
import type { GraphSummary } from "@/lib/api/types";

interface GraphStatsProps {
  summary: GraphSummary;
}

export function GraphStats({ summary }: GraphStatsProps) {
  const items = [
    { title: "城市总数", value: summary.cityCount },
    { title: "线路总数", value: summary.edgeCount },
    { title: "真实线路", value: summary.realEdgeCount },
    { title: "虚拟增补线", value: summary.virtualEdgeCount },
    { title: "Steiner 线路", value: summary.steinerEdgeCount },
  ];

  return (
    <Card className="graph-stats glass-card" size="small">
      <div className="graph-stats__grid">
        {items.map((item) => (
          <Card key={item.title} className="graph-stat-card" size="small" variant="borderless">
            <Statistic title={item.title} value={item.value} />
          </Card>
        ))}
      </div>
    </Card>
  );
}
