import { BookOutlined, HeartOutlined, ReloadOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tag, Typography } from "antd";
import type { HealthData } from "@/lib/api/types";

interface HeaderBarProps {
  apiBaseUrl: string;
  health?: HealthData;
  healthError: boolean;
  healthLoading: boolean;
  graphLoading: boolean;
  onRefreshHealth: () => void;
  onRefreshGraph: () => void;
  onOpenHelp: () => void;
}

export function HeaderBar({
  apiBaseUrl,
  health,
  healthError,
  healthLoading,
  graphLoading,
  onRefreshHealth,
  onRefreshGraph,
  onOpenHelp,
}: HeaderBarProps) {
  const status = healthError ? "DOWN" : health?.status ?? "UNKNOWN";
  const tagColor = status === "UP" ? "success" : "error";

  return (
    <Card className="workspace-header glass-card" variant="borderless">
      <div className="workspace-header__top">
        <div className="workspace-header__title">
          <Typography.Text type="secondary">City Graph Web Console</Typography.Text>
          <h1>城市通信网络规划工作台</h1>
          <p>React + Ant Design 前端，直接对接 `city-graph-api` 的图谱管理与算法接口。</p>
        </div>

        <Space wrap size={[10, 10]}>
          <Button icon={<ReloadOutlined />} loading={graphLoading} onClick={onRefreshGraph}>
            刷新图数据
          </Button>
          <Button icon={<HeartOutlined />} loading={healthLoading} onClick={onRefreshHealth}>
            健康检查
          </Button>
          <Button type="primary" icon={<BookOutlined />} onClick={onOpenHelp}>
            帮助
          </Button>
        </Space>
      </div>

      <div className="workspace-header__meta">
        <Tag color={tagColor} icon={<SyncOutlined spin={healthLoading} />}>
          后端状态：{status}
        </Tag>
        <Typography.Text code>{apiBaseUrl}</Typography.Text>
        {health?.timestamp ? <Typography.Text type="secondary">最近检查：{new Date(health.timestamp).toLocaleString("zh-CN")}</Typography.Text> : null}
      </div>
    </Card>
  );
}
