import { useDeferredValue, useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, InputNumber, Popconfirm, Space, Table, Typography } from "antd";
import type { City, CreateCityPayload, Graph, UpdateCityPayload } from "@/lib/api/types";

interface CityPanelProps {
  graph: Graph;
  selectedCity?: City;
  pendingAction: string | null;
  onSelectCity: (cityId: number) => void;
  onCreateCity: (payload: CreateCityPayload) => Promise<void>;
  onUpdateCity: (cityId: number, payload: UpdateCityPayload) => Promise<void>;
  onRemoveCity: (cityId: number) => Promise<void>;
  onCloseEditor: () => void;
}

export function CityPanel({
  graph,
  selectedCity,
  pendingAction,
  onSelectCity,
  onCreateCity,
  onUpdateCity,
  onRemoveCity,
  onCloseEditor,
}: CityPanelProps) {
  const [createForm] = Form.useForm<CreateCityPayload>();
  const [editForm] = Form.useForm<UpdateCityPayload>();
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    if (selectedCity) {
      editForm.setFieldsValue({
        name: selectedCity.name,
        x: selectedCity.x,
        y: selectedCity.y,
        description: selectedCity.description,
      });
    } else {
      editForm.resetFields();
    }
  }, [editForm, selectedCity]);

  const filteredCities = graph.cities.filter((city) => {
    const searchText = `${city.id} ${city.name} ${city.description}`.toLowerCase();
    return searchText.includes(deferredKeyword.trim().toLowerCase());
  });

  return (
    <div className="panel-section panel-stack">
      <Typography.Title level={5} style={{ margin: 0 }}>
        创建城市
      </Typography.Title>

      <Form
        form={createForm}
        layout="vertical"
        onFinish={async (values) => {
          await onCreateCity({
            ...values,
            description: values.description?.trim() ?? "",
          });
          createForm.resetFields();
        }}
      >
        <Form.Item label="ID" name="id" rules={[{ required: true, message: "请输入城市 ID" }]}>
          <InputNumber min={1} precision={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="名称" name="name" rules={[{ required: true, message: "请输入城市名称" }]}>
          <Input maxLength={80} />
        </Form.Item>
        <Space size={12} style={{ width: "100%" }}>
          <Form.Item label="X 坐标" name="x" rules={[{ required: true, message: "请输入 X 坐标" }]} style={{ flex: 1 }}>
            <InputNumber precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Y 坐标" name="y" rules={[{ required: true, message: "请输入 Y 坐标" }]} style={{ flex: 1 }}>
            <InputNumber precision={0} style={{ width: "100%" }} />
          </Form.Item>
        </Space>
        <Form.Item label="简介" name="description">
          <Input.TextArea rows={3} placeholder="例如：首都、枢纽节点、沿海站点" />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={pendingAction === "addCity"}>
          添加城市
        </Button>
      </Form>

      <Typography.Title level={5} style={{ margin: 0 }}>
        城市列表
      </Typography.Title>

      <Input.Search placeholder="按 ID、名称或简介搜索城市" allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} />

      <div className="panel-table">
        <Table<City>
          rowKey="id"
          size="small"
          pagination={{ pageSize: 6, hideOnSinglePage: true }}
          dataSource={filteredCities}
          rowClassName={(record) => (record.id === selectedCity?.id ? "selected-row" : "")}
          onRow={(record) => ({
            onClick: () => onSelectCity(record.id),
          })}
          columns={[
            { title: "ID", dataIndex: "id", width: 80 },
            { title: "名称", dataIndex: "name" },
            {
              title: "坐标",
              render: (_, record) => `(${record.x}, ${record.y})`,
            },
            {
              title: "简介",
              dataIndex: "description",
              ellipsis: true,
              render: (value: string) => value || "—",
            },
            {
              title: "操作",
              width: 84,
              render: (_, record) => (
                <Button type="link" icon={<EditOutlined />} onClick={() => onSelectCity(record.id)}>
                  编辑
                </Button>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        title={selectedCity ? `编辑城市 #${selectedCity.id}` : "编辑城市"}
        open={Boolean(selectedCity)}
        onClose={onCloseEditor}
        width={400}
        forceRender
      >
        {selectedCity ? (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={async (values) => {
              await onUpdateCity(selectedCity.id, {
                ...values,
                description: values.description?.trim() ?? "",
              });
            }}
          >
            <Form.Item label="城市 ID">
              <Input value={String(selectedCity.id)} disabled />
            </Form.Item>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: "请输入城市名称" }]}>
              <Input />
            </Form.Item>
            <Space size={12} style={{ width: "100%" }}>
              <Form.Item label="X 坐标" name="x" rules={[{ required: true, message: "请输入 X 坐标" }]} style={{ flex: 1 }}>
                <InputNumber precision={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Y 坐标" name="y" rules={[{ required: true, message: "请输入 Y 坐标" }]} style={{ flex: 1 }}>
                <InputNumber precision={0} style={{ width: "100%" }} />
              </Form.Item>
            </Space>
            <Form.Item label="简介" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={pendingAction === "updateCity"}>
                保存修改
              </Button>
              <Popconfirm title="确认删除这个城市吗？" onConfirm={() => onRemoveCity(selectedCity.id)}>
                <Button danger icon={<DeleteOutlined />} loading={pendingAction === "removeCity"}>
                  删除城市
                </Button>
              </Popconfirm>
            </Space>
          </Form>
        ) : null}
      </Drawer>
    </div>
  );
}
