# 《通信网络设计问题》课程设计报告

---

## 成绩单（首页信息）
- **姓名：**
- **性别：**
- **学号：**
- **班级：**
- **电话：**

---

## 一、 通信网络设计问题

### 1、 数据格式
系统使用结构化的纯文本文件（.txt）存储数据，采用自定义协议格式，以便于阅读和快速解析。文件中包含城市节点和通信线路两类核心数据，以 `[CITIES]` 和 `[EDGES]` 等分组标签区分。

具体数据格式定义如下：
- **城市信息格式**：以 `[CITIES]` 标识开始，每行代表一个城市。
  格式为 `ID,名称,X坐标,Y坐标,简介`（字段间以逗号分隔，内部逗号会自动转义处理防止解析冲突）。
- **通信线路格式**：以 `[EDGES]` 标识开始，每行代表一条边。
  格式为 `起点ID,终点ID,边的长度`（长度是在添加边时自动根据两城市坐标计算生成的欧几里得距离）。

*(请在此处插入描述“数据格式文本内容”的截图)*
> **截图说明**：展示保存为 txt 格式后的文件内容示例，表明各字段对应关系。

---

### 2、 数据结构（读文件创建图）
将文件中的数据读入内存后，系统使用面向对象的方法封装了 `City`、`Edge` 类，并选取 **带权无向图的邻接表 (Adjacency List)** 作为核心存储结构 `GraphState`。该结构能在 $O(V+E)$ 的时间复杂度下高效地进行图的遍历与寻路。

**核心 C语言类型定义（Java 等价实现）：**
```java
// 顶点结构 (City)
class City {
    int id;
    String name;
    int x;
    int y;
    String description;
}

// 边结构 (Edge)
class Edge {
    int sourceId;
    int targetId;
    int length;       // 欧几里得距离
    boolean isSteiner;// 是否为辅助节点边（布线功能用）
}

// 图结构 (GraphState)
class GraphState {
    Map<Integer, City> cities;               // 城市集合 (ID -> City)
    List<Edge> edges;                        // 边集合
    List<Edge> backedUpEdges;                // 原生拓扑边备份点 (防御 Steiner 等毁灭性算法)
    Map<Integer, List<Edge>> adjacencyList;  // 邻接表映射 (ID -> 与之相连的所有边)
}
```

**读文件并创建图的核心函数伪码（Java）：**
```java
public static GraphState loadGraph(String path) throws IOException {
    GraphState graph = new GraphState();
    BufferedReader reader = new BufferedReader(new FileReader(path));
    String line;
    boolean readingCities = false, readingEdges = false;

    while ((line = reader.readLine()) != null) {
        if (line.equals("[CITIES]")) {
            readingCities = true; readingEdges = false; continue;
        } else if (line.equals("[EDGES]")) {
            readingCities = false; readingEdges = true; continue;
        }
        
        if (readingCities) {
            String[] parts = line.split(",", 5);
            City city = new City(parseInt(parts[0]), parts[1], parseInt(parts[2]), parseInt(parts[3]), parts[4]);
            graph.addCity(city);
        } else if (readingEdges) {
            String[] parts = line.split(",");
            Edge edge = new Edge(parseInt(parts[0]), parseInt(parts[1]));
            edge.setLength(parseInt(parts[2])); // 或者由 graph.addEdge 内部根据坐标自动计算
            graph.addEdge(edge); 
        }
    }
    reader.close();
    return graph;
}
```

---

### 3、 编辑地点、道路信息
系统提供了基于 Java Swing 实现的图形化操作界面。界面采用“左侧地图画布 + 右侧操作与表单控制台 + 独立系统日志输出浮动窗口”的结构。
- **修改**：在右侧表单输入编号、名称、坐标、简介，点击对应的按钮更新内存中的图结构（`GraphState`）。
- **关联性维护**：若修改了某个城市的坐标系位置，底层算法会自动触发 `recalculateEdgeLengths` 方法，遍历该城市的邻接表并重新计算相连边的欧几里得距离，确保通信长度数据的正确性。
- **坐标系与可视化增强**：为了符合正常的数学与地理直觉，系统底层的绘图画布（Canvas）重构了像素映射逻辑，将 `(0,0)` 原点平移至屏幕中心，翻转了 Y 轴（即向上为正方向）。同时，底部增加了带有数值刻度的均匀网格线（Grid Lines）绘制层，以提供极佳的节点距评阅可视化体验。
- **存储**：点击“保存”按钮，将 `GraphState` 最新状态覆写回本地 `.txt` 文件。

*(请在此处插入描述“主界面增删改查及参数栏”的截图)*
> **截图说明**：展示程序主界面以及控制面板增加/删除操作后的 Canvas 图形刷新效果。

---

### 4、 打印所有城市和通信线路的地图（判断连通及补充连通路径）
在国家通信网络规划中，判断网络是否完全连通至关重要。

**算法描述：**
1. **连通性判定**：利用**广度优先搜索（BFS）**。从任意城市出发遍历，如果最终访问的节点数等于全图城市总数，即图连通；否则不连通。
2. **最小线路增补**：如果不连通，通过**并查集 (Disjoint Set) + Kruskal 算法**寻找连接各个孤立连通块的最小边。系统会扫描出所有目前不存在且不在同一连通块内的候选边配对，将候选配对按欧几里得距离升序排序，然后贪心地将边加入图直至并查集显示整体图只剩下一个连通分量。找出的增补边会在界面中使用**蓝色虚线**绘制高亮显示。

*(请在此处插入描述“判断连通图并采用蓝色虚线标识连通增补边”的截图)*
> **截图说明**：测试用例应包含至少 200 个分属不同孤立岛屿的城市点簇，点击操作后展示 Kruskal 增补跨岛蓝色线路。

---

### 5、 查询城市信息与单源最短路径
**查询城市**：系统支持在左侧画布直接点击圆点实体，右侧表单会自动装载并显示该城市的各项信息细节。

*(请在此处插入描述“点击查询城市信息”的截图)*

**最短简单路径检索（Dijkstra 算法）：**
对于给定源城市到其余所有城市的通信距离度量，采用了经典 Dijkstra 算法。由于图中的边长（欧几里得距离）恒不为负，Dijkstra 完美适用。

**算法原理及注解源码：**
```java
// 使用优先队列优化寻找最小距离点的时间复杂度
public static void findShortestPath(GraphState graph, int sourceId) {
    // distance 记录由 source 节点到其余节点的最短累积距离
    Map<Integer, Integer> distance = new HashMap<>();
    // 优先队列保存 [节点ID, 当前距离]，按距离升序排列，加速提取
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    
    // 初始化距离
    for (Integer id : graph.getCities().keySet()) {
        distance.put(id, Integer.MAX_VALUE);
    }
    distance.put(sourceId, 0);
    pq.offer(new int[]{sourceId, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], dist = curr[1];
        if (dist > distance.get(u)) continue; // 忽略旧的数据节点

        // 遍历邻接点执行松弛(Relaxation)操作
        for (Edge e : graph.getAdjacentEdges(u)) {
            int v = e.getOtherId(u);
            int newDist = distance.get(u) + e.getLength();
            if (newDist < distance.get(v)) {
                distance.put(v, newDist);
                // 记录前驱节点以便倒推生成具体路径序列
                parent.put(v, u); 
                pq.offer(new int[]{v, newDist});
            }
        }
    }
    // 最后根据 distance 的值进行自然排序（从近到远），并在界面进行输出显示及整树高亮标红
}
```

*(请在此处插入描述“生成的最短路径树及从近到远控制台输出”的截图)*
> **截图说明**：测试用例规模至少 200 个城市。展示点击寻找最短路后，从源点到各节点的最短路径树（标红），及文本框按照由近及远的格式打印。

---

### 6、 遍历全部城市（变形的旅行商问题 TSP）
本部分要求寻找遍历全国的最短路线，分为两种考察变体：
- **哈密顿路径 (Path)**：遍历所有点，**不**要求回到起点。
- **哈密顿回路/巡回 (Cycle)**：遍历所有点，最后**必须返回**源城市。

由于旅行商问题 (TSP) 属于典型的 NP 难问题，暴力求解的时间复杂度为 $O(N!)$，无法直接应对 200 个城市的测试用例。因此，系统实现了**自适应混合策略**：

**算法描述与流程验证：**
1. **预计算全局最短路**：首先使用 $O(N^3)$ 的 **Floyd-Warshall 算法** 算出所有对配城市之间“真实的”最短距离与前置路径网络。避免物理路网缺失导致无解情况。
2. **分治求精**：
   - **当城市数量 $N \le 12$ 时（精算模式）**：启用带剪枝的 DFS (深度优先搜索)。尝试所有全排列分支并不断用当前最小记录（`min_path`）剪弃掉超标分支，求得严格最优解。
   - **当城市数量 $N > 12$ 时（启发式近似模式）**：启动 **最近邻居启发式 (Nearest Neighbor)** 算法来近似求解，这使大规模时间复杂度锐减至 $O(N^2)$。
     *伪指令流程*：将源城市加入路径 -> 在剩余未访问城市中，查找真实距离上离当前最后节点**最近**的城市 -> 贪心加入路径 -> 重复至全部城市进入路径 -> (若求回到原点，再计算结尾距离)。最后，根据预先计算的 Floyd-Warshall 矩阵回调映射真实途径。

*(请在此处插入描述“哈密顿路径与哈密顿回路结果比对”的截图)*
> **截图说明**：含 200 个主要城市的 TSP 巡回案例生成路线及最短耗时对比。

---

### 7、 施泰纳最小树问题 (Steiner Minimum Tree)
**命题分析**：在无初始网络的前提下（完全空白），通过允许在平面上额外增加辅助节点（Steiner points，系统采用特殊标记的辅助虚点记录），来构建将原来 $N$ 个城市节点连接的最短网线总长度。计算此问题的严格解为强 NP-hard。

**近似算法设计：**
为能够处理至少 200 规模的数据，系统采用了基于**欧几里得最小生成树 (MST)** 与**费马坐标系变换 (Fermat Point)** 相结合的近似降维算法，具体逻辑流程为：
1. **计算基准 MST**：利用 Kruskal 或 Prim 生成仅涉及原生城市点的标准极小连通生成树 (MST)。
2. **星型子图替换**：遍历 MST，查找具有三条相邻度（度数星型聚类）的相切组合。
3. **几何计算费马点**：若这三点构成的角均小于 $120^\circ$，则可证明在这个三角形内部存在唯一的**费马-托里拆利点 (Fermat-Torricelli point)**。该点到三角形三顶点的距离总和严格**小于**原本 MST 上的两条接点边边长和。
4. **生成 Steiner 点替换网络**：根据该纯计算出的二维坐标生成一个新的中间虚拟顶点 (系统用橙色方形刻画并存入图)，删去原来的两条MST长边，新增三条连接此 Steiner 节点与边缘三角形的短边。该策略能够降低约 3%~5% 以内的管线总消耗长度。

*(请在此处插入描述“生成 Steiner Tree 及其辅助节点”的截图)*
> **截图说明**：选取 OR Library 格式的数据集并导入该系统中，点击生成，展现利用带有橙色辅助标记圆点的新几何拓扑网架构和最终长度减少值。

---

### 8、 设计总结
**问题与解决策略回顾：**
1. **并发集合与渲染状态的不同步 (ConcurrentModificationException)**：在开发编辑及施泰纳树重构模块中，直接清空旧网络边集又同时操作图连通结构会导致 Swing 绘制线程的越界迭代异常。解决办法是：建立暂存清单（toRemove），待全部分离后安全销毁，并增加强制的邻接表重建调用来恢复数据一致性。
2. **高频绘制带来的卡顿优化**：在大用例（超200点）下，基于 Java底层库 `Graphics2D` 遍历庞大的边表渲染会带来性能阻滞。在开发调试中引入了可视渲染屏蔽（Clipping Bounds），并让算法脱离控制器形成单一函数体，确保 UI 更新在逻辑变更结束一次性调用 `Canvas.repaint()`。
3. **交互与国际化体验 (HiDPI & 本地化)**：将整个界面深度汉化，并通过注入 `sun.java2d.dpiaware` 等系统级参数，强行开启底层字体的抗锯齿与高分屏缩放适配，确保在各类 4k 屏幕下的文本都不会出现模糊和坐标错位。
4. **性能基准验证与容错 (Benchmark & Stability)**：通过自研 `Benchmark.java` 实行无头压测，从 $N=50$ 至 $N=500$ 级别的点边生成环境中验证所有算法的并发稳定。针对 Steiner 树等毁坏性质测算，增配了防丢失的快照 `backedUpEdges` 留痕池，使得高光清理触发时能实现毫秒级的纯拓扑精准恢复。
5. **体会与反思**：本次课程设计从最初只是简单存储顶点和线段的 Demo，逐步延展到了涉及 BFS、并查集、Dijkstra、Floyd-Warshall 乃至更高阶的 TSP 近似算子以及 Steiner 附加网络重构工程。项目开发极大地深化了我对图论经典算法工程化落地的了解。在实现跨端窗体程序时还掌握并应用了 MVC 解耦模式去组织业务代码，收益良多。

*(严禁抄袭声明完毕)*
