# City Graph Web

`city-graph-web` 是 `CityGraphApp/city-graph-api` 的独立 React 前端，提供图谱管理、算法执行、TXT 导入导出、健康检查和日志查看能力。

## 技术栈

- React 19
- TypeScript
- Vite
- Ant Design 5
- TanStack Query
- Zustand
- Vitest + Testing Library

## 本地运行

1. 启动后端：

```bash
cd /Users/lmhhh/Desktop/project/CityGraphApp/city-graph-api
./mvnw spring-boot:run
```

2. 启动前端：

```bash
cd /Users/lmhhh/Desktop/project/CityGraphApp/city-graph-web
npm install
npm run dev
```

默认接口地址为 `http://localhost:8080/api/v1`。

## 环境变量

复制 `.env.example` 后按需修改：

```bash
cp .env.example .env.local
```

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | 后端 API 根路径 |

## 可用命令

```bash
npm run dev
npm run build
npm run test
npm run test:run
```

## 前端能力

- 城市节点增删改查
- 通信线路创建、删除与类型识别
- Q5 连通性修复、Q6 最短路径、Q7 TSP、Q8 Steiner Tree
- 清除高亮与生成边
- TXT 导入导出
- 画布选点、选边、平移、缩放、适配视图
- 健康检查和运行日志
