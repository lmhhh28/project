import { DeleteOutlined, DownloadOutlined, InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Popconfirm, Space, Typography, Upload } from "antd";

interface FilePanelProps {
  warnings: string[];
  pendingAction: string | null;
  onImportGraph: (file: File) => Promise<void>;
  onExportGraph: () => Promise<void>;
  onClearGraph: () => Promise<void>;
}

export function FilePanel({ warnings, pendingAction, onImportGraph, onExportGraph, onClearGraph }: FilePanelProps) {
  return (
    <div className="panel-section panel-stack">
      <Alert className="panel-note" type="info" showIcon message="TXT 导入导出格式遵循 API.md 约定：`[CITIES]` 与 `[EDGES]` 两个分段。" />

      <Upload.Dragger
        className="panel-uploader"
        accept=".txt,text/plain"
        showUploadList={false}
        disabled={pendingAction === "importGraph"}
        beforeUpload={(file) => {
          void onImportGraph(file as File);
          return Upload.LIST_IGNORE;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">拖拽或点击上传图谱 TXT</p>
        <p className="ant-upload-hint">后端会按统一格式解析，并把 warnings 返回给前端。</p>
      </Upload.Dragger>

      <Space wrap>
        <Button icon={<UploadOutlined />} loading={pendingAction === "importGraph"}>
          通过拖拽区导入
        </Button>
        <Button icon={<DownloadOutlined />} loading={pendingAction === "exportGraph"} onClick={() => onExportGraph()}>
          导出 TXT
        </Button>
        <Popconfirm title="确认清空整张图吗？" onConfirm={() => onClearGraph()}>
          <Button danger icon={<DeleteOutlined />} loading={pendingAction === "clearGraph"}>
            清空图谱
          </Button>
        </Popconfirm>
      </Space>

      <Card className="panel-subcard" size="small" title="最近导入警告">
        {warnings.length === 0 ? (
          <Typography.Text type="secondary">最近一次导入没有 warnings。</Typography.Text>
        ) : (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {warnings.map((warning) => (
              <Alert key={warning} type="warning" showIcon message={warning} />
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
}
