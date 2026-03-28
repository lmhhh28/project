import { ClearOutlined } from "@ant-design/icons";
import { Button, Card, Empty, List, Tag, Typography } from "antd";
import type { UiLogEntry } from "@/types/ui";

interface LogPanelProps {
  logs: UiLogEntry[];
  onClear: () => void;
}

const COLOR_BY_LEVEL: Record<UiLogEntry["level"], string> = {
  info: "blue",
  success: "green",
  warning: "orange",
  error: "red",
};

export function LogPanel({ logs, onClear }: LogPanelProps) {
  return (
    <Card
      className="workspace-log-card glass-card"
      title="运行日志"
      extra={
        <Button icon={<ClearOutlined />} onClick={onClear}>
          清空日志
        </Button>
      }
    >
      <div className="panel-section">
        {logs.length === 0 ? (
          <Empty description="暂无日志" />
        ) : (
          <List
            className="log-list"
            dataSource={logs}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <div className="log-item">
                  <Typography.Text className="log-time">{new Date(item.createdAt).toLocaleTimeString("zh-CN", { hour12: false })}</Typography.Text>
                  <Tag color={COLOR_BY_LEVEL[item.level]}>{item.source}</Tag>
                  <Typography.Text>{item.message}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Card>
  );
}
