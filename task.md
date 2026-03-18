# 城市通信线路连通与布线系统 - 开发任务清单

- [x] 1. 基础架构与Model层设计
  - [x] City 和 Edge 实体类（包含坐标和基于欧几里得距离计算的边长）
  - [x] GraphState 核心图数据结构封装（节点集、边集、邻接表映射）

- [x] 2. 持久化层实现 (File I/O)
  - [x] 设计并实现自定文本协议/JSON对图数据的快速序列化与反序列化逻辑

- [x] 3. View 层与 GUI 基础框架 (基于 Java Swing)
  - [x] 搭建 MainFrame 窗口及分屏（左图右控）界面结构
  - [x] 基于 `JPanel` 及 `Graphics2D` 实现 [GraphCanvas](file:///Users/lmhhh/Desktop/project/CityGraphApp/src/com/citygraph/view/GraphCanvas.java#15-115) 坐标系绘图功能
  - [x] [ControlPanel](file:///Users/lmhhh/Desktop/project/CityGraphApp/src/com/citygraph/view/ControlPanel.java#11-211) 控制面板及数据录入/操作表单组件集成

- [x] 4. 增删改及核心业务图算法 (Controller & Algorithms)
  - [x] 城市及通信线路的基础增、删、改逻辑与重绘刷新
  - [x] Q5: 连通图判断 (BFS) 以及使用 Kruskal 算法求出使全图连通的“最小增补线路”
  - [x] Q6: 基于 Dijkstra 算法求出给定城市到其他任意城市的最近/最短通信路径 
  - [x] Q7: 旅行商路径问题 (TSP)。针对遍历所有城市的最小距离实现哈密顿回路/哈密顿路径检索（包含精算和启发式近似算子）
  - [x] Q8: 解决 N点空白网络连接布线问题。以欧几里得最小生成树(MST)为基础叠加点置换启发式模拟**施泰纳树(Steiner Minimum Tree)**的近似算法

- [x] 5. 测试与联调交互优化
  - [x] 验证端到端各算法在平面不同分布案例下的正确度
  - [x] Canvas 画布增加点击交互拾取实体、路径绘制动画等 UX 提升
  - [x] 打包确保具备强跨平台性 (Write Once, Run Anywhere)
