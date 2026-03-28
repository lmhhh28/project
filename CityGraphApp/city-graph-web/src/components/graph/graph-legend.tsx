import { AimOutlined, BorderOutlined, NodeIndexOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Flex, Space, Tag, Typography } from "antd";
import type { GraphLegendState } from "@/types/ui";

interface GraphLegendProps {
  legend: GraphLegendState;
  onToggle: (key: keyof GraphLegendState) => void;
  onResetViewport: () => void;
  onFitViewport: () => void;
}

export function GraphLegend({ legend, onToggle, onResetViewport, onFitViewport }: GraphLegendProps) {
  return (
    <Card
      size="small"
      className="graph-legend glass-card"
      title={
        <Space>
          <NodeIndexOutlined />
          <span>图层与视图</span>
        </Space>
      }
      extra={<Tag color="blue">SVG</Tag>}
    >
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Flex wrap gap={8}>
          <Tag color="default">灰色 = 真实线路</Tag>
          <Tag color="blue">蓝虚线 = 连通性补边</Tag>
          <Tag color="red">红色 = 最短路 / TSP 高亮</Tag>
          <Tag color="orange">橙虚线 = Steiner</Tag>
        </Flex>

        <Checkbox checked={legend.showGrid} onChange={() => onToggle("showGrid")}>
          显示坐标网格
        </Checkbox>
        <Checkbox checked={legend.showLabels} onChange={() => onToggle("showLabels")}>
          显示节点与边长度标签
        </Checkbox>
        <Checkbox checked={legend.showRealEdges} onChange={() => onToggle("showRealEdges")}>
          显示真实线路
        </Checkbox>
        <Checkbox checked={legend.showHighlightedEdges} onChange={() => onToggle("showHighlightedEdges")}>
          显示高亮线路
        </Checkbox>
        <Checkbox checked={legend.showVirtualEdges} onChange={() => onToggle("showVirtualEdges")}>
          显示虚拟增补线
        </Checkbox>
        <Checkbox checked={legend.showSteinerEdges} onChange={() => onToggle("showSteinerEdges")}>
          显示 Steiner 线路
        </Checkbox>
        <Checkbox checked={legend.showSteinerCities} onChange={() => onToggle("showSteinerCities")}>
          显示 Steiner 节点
        </Checkbox>

        <div className="graph-actions">
          <Typography.Text type="secondary">
            鼠标滚轮缩放，按住空白区域拖动画布。
          </Typography.Text>
          <Space>
            <Button size="small" icon={<AimOutlined />} onClick={onFitViewport}>
              适配视图
            </Button>
            <Button size="small" icon={<BorderOutlined />} onClick={onResetViewport}>
              重置
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
