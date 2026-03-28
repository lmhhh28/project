import { useDeferredValue, useState } from "react";
import { DeleteOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { Edge, Graph, CreateEdgePayload } from "@/lib/api/types";
import { edgeKey, getEdgeVariant, isSteinerCity } from "@/lib/graph";

interface EdgePanelProps {
  graph: Graph;
  selectedEdge?: Edge;
  pendingAction: string | null;
  onSelectEdge: (selectedEdgeKey: string) => void;
  onCreateEdge: (payload: CreateEdgePayload) => Promise<void>;
  onRemoveEdge: (sourceId: number, targetId: number) => Promise<void>;
}

export function EdgePanel({
  graph,
  selectedEdge,
  pendingAction,
  onSelectEdge,
  onCreateEdge,
  onRemoveEdge,
}: EdgePanelProps) {
  const [form] = Form.useForm<CreateEdgePayload>();
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const manualCityOptions = graph.cities
    .filter((city) => !isSteinerCity(city))
    .map((city) => ({
      label: `${city.id} · ${city.name}`,
      value: city.id,
    }));

  const filteredEdges = graph.edges.filter((edge) => {
    const variant = getEdgeVariant(edge);
    const searchText = `${edge.sourceId} ${edge.targetId} ${edge.length} ${variant}`.toLowerCase();
    return searchText.includes(deferredKeyword.trim().toLowerCase());
  });

  return (
    <div className="panel-section panel-stack">
      <Alert type="info" showIcon message="边的长度由后端根据城市坐标自动计算，前端只需要提交 sourceId 和 targetId。" />

      <Typography.Title level={5} style={{ margin: 0 }}>
        创建线路
      </Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          await onCreateEdge(values);
          form.resetFields();
        }}
      >
        <Form.Item label="起点城市" name="sourceId" rules={[{ required: true, message: "请选择起点城市" }]}>
          <Select options={manualCityOptions} placeholder="选择起点" showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item
          label="终点城市"
          name="targetId"
          dependencies={["sourceId"]}
          rules={[
            { required: true, message: "请选择终点城市" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const sourceId = getFieldValue("sourceId");
                if (!sourceId || !value) {
                  return Promise.resolve();
                }
                if (sourceId === value) {
                  return Promise.reject(new Error("不允许创建自环。"));
                }
                const duplicated = graph.edges.some((edge) => edgeKey(edge.sourceId, edge.targetId) === edgeKey(sourceId, value));
                if (duplicated) {
                  return Promise.reject(new Error("该线路已存在。"));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Select options={manualCityOptions} placeholder="选择终点" showSearch optionFilterProp="label" />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={pendingAction === "addEdge"}>
          添加线路
        </Button>
      </Form>

      <Typography.Title level={5} style={{ margin: 0 }}>
        线路列表
      </Typography.Title>

      <Input.Search placeholder="按端点、长度或线路类型筛选" allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} />

      {selectedEdge ? (
        <Card size="small" title="当前选中线路">
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Typography.Text>
              {selectedEdge.sourceId} ↔ {selectedEdge.targetId} · 长度 {selectedEdge.length}
            </Typography.Text>
            <Space wrap>
              {selectedEdge.highlighted ? <Tag color="red">高亮</Tag> : null}
              {selectedEdge.virtual ? <Tag color="blue">虚拟增补</Tag> : null}
              {selectedEdge.steiner ? <Tag color="orange">Steiner</Tag> : null}
              {!selectedEdge.highlighted && !selectedEdge.virtual && !selectedEdge.steiner ? <Tag>真实线路</Tag> : null}
            </Space>
            <Popconfirm title="确认删除这条线路吗？" onConfirm={() => onRemoveEdge(selectedEdge.sourceId, selectedEdge.targetId)}>
              <Button danger icon={<DeleteOutlined />} loading={pendingAction === "removeEdge"}>
                删除选中线路
              </Button>
            </Popconfirm>
          </Space>
        </Card>
      ) : null}

      <div className="panel-table">
        <Table<Edge>
          rowKey={(record) => edgeKey(record.sourceId, record.targetId)}
          size="small"
          pagination={{ pageSize: 7, hideOnSinglePage: true }}
          dataSource={filteredEdges}
          rowClassName={(record) =>
            selectedEdge && edgeKey(record.sourceId, record.targetId) === edgeKey(selectedEdge.sourceId, selectedEdge.targetId) ? "selected-row" : ""
          }
          onRow={(record) => ({
            onClick: () => onSelectEdge(edgeKey(record.sourceId, record.targetId)),
          })}
          columns={[
            {
              title: "线路",
              render: (_, record) => (
                <Space>
                  <LinkOutlined />
                  {record.sourceId} ↔ {record.targetId}
                </Space>
              ),
            },
            { title: "长度", dataIndex: "length", width: 80 },
            {
              title: "类型",
              render: (_, record) => {
                const variant = getEdgeVariant(record);
                if (variant === "highlighted") {
                  return <Tag color="red">高亮</Tag>;
                }
                if (variant === "virtual") {
                  return <Tag color="blue">虚拟</Tag>;
                }
                if (variant === "steiner") {
                  return <Tag color="orange">Steiner</Tag>;
                }
                return <Tag>真实</Tag>;
              },
            },
            {
              title: "操作",
              width: 96,
              render: (_, record) => (
                <Popconfirm title="确认删除这条线路吗？" onConfirm={() => onRemoveEdge(record.sourceId, record.targetId)}>
                  <Button danger type="link" icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
