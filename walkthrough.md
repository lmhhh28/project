# 城市通信线路连通与布线系统 - 实现与操作指南

经过规划与开发，本项目已完整使用核心 Java (无外部依赖库) 实现了您要求的跨平台城市通信网规划软件。以下是项目交付摘要及执行方式：

## 1. 编译与运行
由于采用纯 Java 原生 Swing 编写，没有任何第三方依赖包，您可以非常方便地在任何包含 Java (JDK 8+) 的终端运行它：
```bash
# 1. 编译 (在项目根目录 CityGraphApp 下执行)
mkdir -p bin
javac -d bin -sourcepath src $(find src -name "*.java")

# 2. 运行
java -cp bin com.citygraph.Main
```

## 2. 功能及交互指南
启动程序后，界面分为 **左侧的视图画布区** 和 **右侧的操作控制台**。
- **信息增删改查 (Req 2, 3)**: 右侧的操作面板提供了 [City](file:///Users/lmhhh/Desktop/project/CityGraphApp/src/com/citygraph/model/City.java#9-59) 和 [Edge](file:///Users/lmhhh/Desktop/project/CityGraphApp/src/com/citygraph/model/Edge.java#9-92) 的输入表单，您可以输入具体的 ID、名字和欧几里得平面的 X,Y 坐标添加城市。您也可以在左侧画布直接点击圆点拾取城市信息，将其填入表单以便 Update 或 Delete。
- **文件持久化保存 (Req 4)**: 在控制台顶部的 `Data IO` 区域点击 `Save` 或 `Load` 可以将当前图数据保存为可读纯文本。
- **连通图验证及增补 (Req 5)**: 点击 `Q5: Connectivity Check / Fix` 按钮，系统后台会执行 BFS 检验连通性。如果图不连通，将动用 **Kruskal's Algorithm** 及并查集算出总长最小的跨区域推荐虚线并在图上用**虚线高亮显示**，同时控制台打印出增加的虚线数量与长度。
- **单源最短路径 (Req 6)**: 在 Target Node ID 填入起点城市编号，点击 `Q6: Shortest Paths (Dijkstra)`。控制台会依次输出该点到所有可达城市的最短路径全路由与总距离，且界面上的线路会高亮。
- **旅行商问题 (TSP) (Req 7)**: 提供了 TSP 路径（不回起点）和 TSP 回路（回起点）两个按钮。这背后集成了一套自适应混合算法引擎：
  - 如果城市规模很小 ($N \le 12$)：应用严谨的具有分支定界的带记忆回溯搜索（DFS），求出绝对的最优解。
  - 如果城市规模较大：为防止算力卡死，隐式降级使用基于 Floyd-Warshall 与 Nearest Neighbor Heuristic 的优质近似算法。
- **NP-Hard 空白网络布线 / Steiner 最小树 (Req 8)**: 点击 `Q8: Steiner Tree Generation`。算法会清空所有线路，然后重新求全局 MST(最小生成树)。在此之上，搜索满足角点定理（夹角$<120^\circ$）的局部星型邻接区域，并通过梯度下降搜索其**费马点 (Fermat-Torricelli point)** 建立 Steiner 辅助节点（图形上用橙色方块表示）。以此来优化原有的几何线路长度。

## 3. 架构亮点展示
- **无依赖，随时可跑**: Write Once, Run Anywhere。
- **UI 与算法严格解耦**: 所有复杂的图论操作（Kruskal, DFS, Floyd-Warshall）均被封装于 [AlgorithmEngine](file:///Users/lmhhh/Desktop/project/CityGraphApp/src/com/citygraph/algorithm/AlgorithmEngine.java#13-619) 静态引擎包中。

您可以运行项目并验证！如果符合预期或有其它需要增补的边界情况，请随时指出。
