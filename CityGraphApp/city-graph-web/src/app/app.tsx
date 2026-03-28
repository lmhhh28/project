import { useState } from "react";
import zhCN from "antd/locale/zh_CN";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspacePage } from "@/app/workspace-page";

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  );

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          colorSuccess: "#389e0d",
          colorWarning: "#d46b08",
          colorInfo: "#1677ff",
          colorTextBase: "#14213d",
          borderRadius: 18,
          fontFamily: '"IBM Plex Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <WorkspacePage />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
