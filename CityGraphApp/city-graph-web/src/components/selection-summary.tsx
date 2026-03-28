import { Card, Descriptions, Empty, Flex, Space, Tag, Typography } from "antd";
import type { City, Edge, Graph } from "@/lib/api/types";
import { getEdgeVariant, isSteinerCity } from "@/lib/graph";

interface SelectionSummaryProps {
  graph: Graph;
  selectedCity?: City;
  selectedEdge?: Edge;
}

function getVariantLabel(edge: Edge) {
  const variant = getEdgeVariant(edge);
  if (variant === "highlighted") {
    return <Tag color="red">高亮线路</Tag>;
  }
  if (variant === "virtual") {
    return <Tag color="blue">虚拟增补线</Tag>;
  }
  if (variant === "steiner") {
    return <Tag color="orange">Steiner 线路</Tag>;
  }
  return <Tag>真实线路</Tag>;
}

export function SelectionSummary({ graph, selectedCity, selectedEdge }: SelectionSummaryProps) {
  const sourceCity = selectedEdge ? graph.cities.find((city) => city.id === selectedEdge.sourceId) : undefined;
  const targetCity = selectedEdge ? graph.cities.find((city) => city.id === selectedEdge.targetId) : undefined;

  return (
    <Card className="inspector-card glass-card" variant="borderless" title="当前选中">
      {selectedCity ? (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Flex justify="space-between" align="center">
            <Typography.Title level={5} style={{ margin: 0 }}>
              城市 #{selectedCity.id} {selectedCity.name}
            </Typography.Title>
            {isSteinerCity(selectedCity) ? <Tag color="orange">Steiner</Tag> : <Tag color="blue">普通城市</Tag>}
          </Flex>

          <Descriptions size="small" column={1}>
            <Descriptions.Item label="坐标">
              ({selectedCity.x}, {selectedCity.y})
            </Descriptions.Item>
            <Descriptions.Item label="简介">{selectedCity.description || "暂无简介"}</Descriptions.Item>
            <Descriptions.Item label="提示">已在城市管理标签中自动填充编辑表单。</Descriptions.Item>
          </Descriptions>
        </Space>
      ) : selectedEdge ? (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Flex justify="space-between" align="center">
            <Typography.Title level={5} style={{ margin: 0 }}>
              线路 {selectedEdge.sourceId} ↔ {selectedEdge.targetId}
            </Typography.Title>
            {getVariantLabel(selectedEdge)}
          </Flex>

          <Descriptions size="small" column={1}>
            <Descriptions.Item label="起点">{sourceCity?.name ?? selectedEdge.sourceId}</Descriptions.Item>
            <Descriptions.Item label="终点">{targetCity?.name ?? selectedEdge.targetId}</Descriptions.Item>
            <Descriptions.Item label="长度">{selectedEdge.length}</Descriptions.Item>
          </Descriptions>
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Typography.Text className="inspector-empty">点击画布中的城市或线路，可以查看详情并进入编辑流程。</Typography.Text>}
        />
      )}
    </Card>
  );
}
