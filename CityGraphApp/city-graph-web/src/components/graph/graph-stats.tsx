import { BarChartOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";
import type { GraphSummary } from "@/lib/api/types";

interface GraphStatsProps {
  summary: GraphSummary;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function GraphStats({ summary, collapsed, onToggleCollapse }: GraphStatsProps) {
  const items = [
    { title: "城市总数", value: summary.cityCount },
    { title: "线路总数", value: summary.edgeCount },
    { title: "真实线路", value: summary.realEdgeCount },
    { title: "虚拟增补线", value: summary.virtualEdgeCount },
    { title: "Steiner 线路", value: summary.steinerEdgeCount },
  ];

  return (
    <Card
      className="graph-stats glass-card"
      size="small"
      title={
        <Space size={8}>
          <BarChartOutlined />
          <span>图统计</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={collapsed ? <DownOutlined /> : <UpOutlined />}
          onClick={onToggleCollapse}
          aria-label={collapsed ? "展开统计面板" : "收起统计面板"}
        />
      }
    >
      {collapsed ? (
        <div className="graph-stats__collapsed">
          <Typography.Text type="secondary">城市 {summary.cityCount}</Typography.Text>
          <Typography.Text type="secondary">线路 {summary.edgeCount}</Typography.Text>
        </div>
      ) : (
        <div className="graph-stats__grid">
          {items.map((item) => (
            <div key={item.title} className="graph-stat-item">
              <Typography.Text className="graph-stat-item__label" type="secondary">
                {item.title}
              </Typography.Text>
              <span className="graph-stat-item__value">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
