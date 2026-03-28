import { BookOutlined, LinkOutlined } from "@ant-design/icons";
import { Collapse, Descriptions, Drawer, Space, Tag, Typography } from "antd";

interface HelpPanelProps {
  open: boolean;
  apiBaseUrl: string;
  onClose: () => void;
}

export default function HelpPanel({ open, apiBaseUrl, onClose }: HelpPanelProps) {
  return (
    <Drawer className="help-drawer" title="使用帮助" open={open} onClose={onClose} width={520} extra={<Tag color="blue">API.md / HELP.md</Tag>}>
      <Space direction="vertical" size={20} className="help-grid">
        <Typography.Paragraph>
          这个前端遵循 <Typography.Text code>{apiBaseUrl}</Typography.Text> 下的统一响应结构，并映射了桌面版的核心工作流：画布查看、右侧控制台、底部日志。
        </Typography.Paragraph>

        <Descriptions size="small" column={1} title="启动方式">
          <Descriptions.Item label="后端">`cd CityGraphApp/city-graph-api && ./mvnw spring-boot:run`</Descriptions.Item>
          <Descriptions.Item label="前端">`cd CityGraphApp/city-graph-web && npm run dev`</Descriptions.Item>
        </Descriptions>

        <Collapse
          items={[
            {
              key: "endpoints",
              label: "已接入接口",
              children: (
                <Space direction="vertical" size={8}>
                  <Tag icon={<LinkOutlined />}>GET /graph</Tag>
                  <Tag icon={<LinkOutlined />}>POST /graph/cities</Tag>
                  <Tag icon={<LinkOutlined />}>POST /graph/edges</Tag>
                  <Tag icon={<LinkOutlined />}>POST /graph/import</Tag>
                  <Tag icon={<LinkOutlined />}>GET /graph/export</Tag>
                  <Tag icon={<LinkOutlined />}>POST /algorithms/connectivity-fix</Tag>
                  <Tag icon={<LinkOutlined />}>POST /algorithms/shortest-path</Tag>
                  <Tag icon={<LinkOutlined />}>POST /algorithms/tsp</Tag>
                  <Tag icon={<LinkOutlined />}>POST /algorithms/steiner-tree</Tag>
                  <Tag icon={<LinkOutlined />}>GET /health</Tag>
                </Space>
              ),
            },
            {
              key: "txt",
              label: "TXT 文件格式",
              children: (
                <Typography.Paragraph>
                  导入导出都使用两段结构：先是 <Typography.Text code>[CITIES]</Typography.Text>，每行
                  `id,name,x,y,description`；再是 <Typography.Text code>[EDGES]</Typography.Text>，每行
                  `sourceId,targetId`。导出时不会包含虚拟边和 Steiner 边。
                </Typography.Paragraph>
              ),
            },
            {
              key: "algorithms",
              label: "算法说明",
              children: (
                <Space direction="vertical" size={10}>
                  <Typography.Text>
                    Q5 会检查图是否连通，并用蓝色虚拟边展示 Kruskal 推导出的最小增补连接。
                  </Typography.Text>
                  <Typography.Text>
                    Q6 和 Q7 会把路径高亮成红色；Q8 会生成橙色 Steiner 线路与辅助节点。
                  </Typography.Text>
                  <Typography.Text>
                    按照 API 文档，算法执行前会自动执行一次“清除高亮与生成边”。
                  </Typography.Text>
                </Space>
              ),
            },
          ]}
        />

        <Space>
          <BookOutlined />
          <Typography.Text type="secondary">
            HELP.md 主要描述 Spring Boot 工程与 Maven 基础；前端联调关键约定来自 API.md。
          </Typography.Text>
        </Space>
      </Space>
    </Drawer>
  );
}
