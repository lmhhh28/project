# 《通信网络设计问题》课程设计报告

## 一、通信网络设计问题

### 1、数据格式
系统使用纯文本文件（`.txt`）存储图数据，文件由两个分区组成：`[CITIES]` 与 `[EDGES]`。

1. `城市数据`：每行一个城市，字段顺序为：
   `id,name,x,y,description`
2. `线路数据`：每行一条无向边，字段顺序为：
   `sourceId,targetId`

说明：
- 线路长度不在文件中持久化，由程序在 `addEdge` 时根据两城市坐标按欧几里得距离自动计算并四舍五入取整。
- 为兼容测试脚本，读文件时若线路行有第三列（如 `u,v,0`），程序也会忽略第三列并正确导入前两列。
- 城市名称、简介支持 CSV 转义（逗号、双引号、换行）。

示例：

```text
[CITIES]
// 城市 ID，城市名，横坐标，纵坐标，备注
1,北京,200,100,首都
2,上海,300,300,直辖市
3,广州,250,500,南方节点

[EDGES]
// 起始边，终止边
1,2
2,3
```

---

### 2、数据结构（读文件创建图）
本程序采用 Java 实现，核心为“带权无向图 + 邻接表索引”。

#### 2.1 核心类
- `City`：城市编号、名称、坐标、简介
- `Edge`：起点 ID、终点 ID、长度、虚拟边标记、高亮标记、Steiner 标记
- `GraphState`：
  - `Map<Integer, City> cities`：城市表
  - `List<Edge> edges`：边表
  - `Set<Edge> edgeSet`：判重（O(1)）
  - `Map<Integer, List<Edge>> adjacencyList`：邻接表
  - `List<Edge> backedUpEdges`：Steiner 构造前原始边快照

#### 2.2 相关数据结构

```java
public class City {
    private int id;
    private String name;
    private int x;
    private int y;
    private String description; 
}

public class Edge {
    private int sourceId;
    private int targetId;
    private int length; // 边长

    // 边的类型（ Kruskal 最小生成树边，Steiner 边 ）
    private boolean isVirtual; 
    private boolean isHighlighted;
    private boolean isSteiner;
}
```

#### 2.3 读文件建图流程
- 识别分区头 `[CITIES]` 与 `[EDGES]`
- 城市行使用 CSV 解析器（支持引号转义）
- 线路行读取前两列为端点 ID
- 调用 `graph.addCity(...)`、`graph.addEdge(...)` 构建内存图
- 返回 `LoadResult(graph, warnings)`，无效行记入警告列表并在 UI 日志显示

关键伪码：

```java
LoadResult loadGraph(path):
    graph = new GraphState()
    warnings = []
    for line in file:
        if line == "[CITIES]": mode = CITIES
        else if line == "[EDGES]": mode = EDGES
        else if mode == CITIES:
            parse csv -> id,name,x,y,desc
            graph.addCity(new City(...))
        else if mode == EDGES:
            parse -> src,tgt
            graph.addEdge(new Edge(src,tgt))
    return new LoadResult(graph, warnings)
```


<!-- > ![](<截屏2026-03-20 14.59.56.png>) 导入文件（50 城市 + 路径） -->
---

### 3、编辑地点、道路信息
系统提供 Swing 图形界面（左侧画布 + 右侧控制面板 + 独立日志窗口），支持以下编辑操作：

1. 城市增删改
   - 添加：输入 `ID/名称/X/Y/简介`
   - 修改：按 ID 更新城市信息
   - 删除：删除城市并自动删除关联线路
2. 线路增删
   - 添加：输入起点 ID、终点 ID
   - 删除：按端点删除无向边
3. 数据关联一致性
   - 修改城市坐标时，自动重算该城市关联边长度
   - 使用 `edgeSet + adjacencyList` 保持边集合与邻接关系同步
4. 文件持久化
   - “保存”将当前状态写回文本
   - “加载”从文本恢复状态

输入校验：
- 城市名称不能为空
- ID、坐标必须为整数
- 禁止自环与重复边

<!-- > ![](<截屏2026-03-20 16.39.02.png>) 添加城市

> ![](<截屏2026-03-20 16.39.11.png>) 删除城市

> ![](<截屏2026-03-20 16.39.33.png>) 修改城市

> ![](<截屏2026-03-20 16.40.05.png>) 添加路径

> ![](<截屏2026-03-20 16.40.10.png>) 删除路径

> ![](<截屏2026-03-20 16.40.29.png>) 保存路径

> ![](<截屏2026-03-20 16.40.39.png>) 导入路径 -->
---

### 4、打印所有城市和通信线路的地图
#### 4.1 地图绘制
- 画布以中心为 $(0, 0)$，$y$ 轴向上为正
- 绘制背景网格与坐标刻度
- 线路颜色规则：
  - 普通边：灰色
  - 连通性增补边（Q5）：蓝色虚线
  - $\text{Steiner}$ 边（Q8）：橙色虚线
  - 最短路/$\text{TSP}$ 高亮：红色粗线
- 城市显示：普通城市为蓝色圆点，Steiner 点为橙色方块

#### 4.2 连通性判断与最小增补方案（Q5）
算法流程：
1. 先用 BFS 判断当前真实线路是否连通
2. 若不连通：使用并查集表示当前连通分量，枚举不同分量之间的候选边，按长度升序排序，再$\text{Kruskal}$ 贪心加入最短可连边，直至全图连通
3. 新增边记为 `virtual`，并在画布上用蓝色虚线展示

复杂度（$n$ 城市）：
- 连通性 BFS：$O(V+E)$
- 候选边构建 + 排序：约 $O(V^2 \log V)$

<!-- > ![](<截屏2026-03-20 17.03.18.png>) 检查连通性并生成增补边 -->

---

### 5、查询城市信息
#### 5.1 城市信息查询
- 在画布点击城市节点，系统自动回填该城市信息到右侧表单
- 日志窗口输出点击对象信息

#### 5.2 单源最短路径（Q6）
给定起点城市，使用 $\text{Dijkstra}$ 计算到其余可达城市的最短路径与距离：

1. 初始化 `dist[source]=0`，其余为无穷大
2. 用最小堆反复取当前最短未确定节点
3. 对邻边执行松弛
4. 用 `parent` 记录前驱，最终回溯得到路径
5. 将结果按距离从近到远排序输出，并高亮路径边

复杂度：$O((V+E)\log{V})$（堆优化）

> ![](<截屏2026-03-20 17.07.27.png>) 单源最短路径并排序

---

### 6、遍历全部城市（变形的旅行商问题）
题目要求：
- 从某城市出发访问所有城市，允许重复城市
- 分两种：
  - `Path`：不必回起点
  - `Cycle`：必须回起点

当前实现采用“精确 + 贪心”混合策略：

1. 先做 $\text{Floyd-Warshall}$：求任意两城市最短路距离矩阵 `dist`，记录 `next` 用于路径展开
2. 小规模（$N <= 20$）：使用位压缩动态规划（DP）精确求解
3. 大规模（$N > 20$）：先用贪心构造初解，再做 2-opt 局部优化
4. 将宏观访问序列用 `next` 展开成真实路径并高亮

复杂度：
- $\text{Floyd}$：$O(N^3)$
- 精确 $DP$：$O(N^2 \times 2^N)$（仅用于小规模）
- 贪心：约 $O(N^2)$（不含 $\text{Floyd}$）

<!-- > ![](<截屏2026-03-20 17.09.14.png>) 哈密顿路径
> ![](<截屏2026-03-20 17.09.24.png>) 哈密顿回路 -->
---

### 7、施泰纳最小树问题
题目 8 为 $\text{NP-hard}$ 问题，本系统实现了可用于大规模测试的近似解法（Q8）：

1. 清理历史 $\text{Steiner}$ 点
2. 备份原始真实边 `backedUpEdges`
3. 从空白线路开始，先构造最小生成树 $(\text{Kruskal})$
4. 在局部结构上尝试 $\text{Fermat}$ 点改进：对满足角度条件的三元组估算 Fermat 点，若新结构总长度更短，则以 Steiner 点替换局部边
5. 将结果边写回图，标记为 `steiner`
6. 若构造失败，自动回滚并恢复图状态

说明：这是近似算法，不保证全局最优，通过 `clearHighlights` 可恢复到备份的原始真实边

#### 7.1 Fermat 点坐标推导（证明）
设三角形三个顶点为

$$
A(x_1,y_1),\;B(x_2,y_2),\;C(x_3,y_3),
$$

并且内角都小于 $120^\circ$。记目标函数

$$
\Phi(P)=|PA|+|PB|+|PC|.
$$

$\text{Fermat}$ 点 $F$ 是 $\Phi(P)$ 的极小点。

1. 一阶最优条件（平衡条件）  

当极小点在三角形内部时，有

$$
\nabla \Phi(F)=\frac{F-A}{|F-A|}+\frac{F-B}{|F-B|}+\frac{F-C}{|F-C|}=0.
$$

这等价于三条单位向量两两夹角均为 $120^\circ$，即

$$
\angle BFC=\angle CFA=\angle AFB=120^\circ.
$$

2. 三线坐标结论  

由上面的 $120^\circ$ 角关系，根据$\text{Ceva}$定理的正弦形式，可得第一 $\text{Fermat}$ 点的三线坐标

$$
x:y:z=\csc(A+60^\circ):\csc(B+60^\circ):\csc(C+60^\circ),
$$

其中 $A,B,C$ 是三角形 $ABC$ 的内角，$x,y,z$ 分别为点到边 $BC,CA,AB$ 的有向距离。

3. 三线坐标转重心坐标  

设

$$
a=|BC|,\;b=|CA|,\;c=|AB|.
$$

三线坐标到重心坐标满足

$$
\lambda_A:\lambda_B:\lambda_C=ax:by:cz,
$$

因此

$$
\lambda_A:\lambda_B:\lambda_C=
\frac{a}{\sin(A+60^\circ)}:
\frac{b}{\sin(B+60^\circ)}:
\frac{c}{\sin(C+60^\circ)}.
$$

令

$$
w_A=\frac{a}{\sin(A+60^\circ)},\;
w_B=\frac{b}{\sin(B+60^\circ)},\;
w_C=\frac{c}{\sin(C+60^\circ)}.
$$

4. 费马点笛卡尔坐标  

由重心坐标定义：

$$
F=\frac{w_AA+w_BB+w_CC}{w_A+w_B+w_C},
$$

即

$$
x_F=\frac{w_Ax_1+w_Bx_2+w_Cx_3}{w_A+w_B+w_C},\quad
y_F=\frac{w_Ay_1+w_By_2+w_Cy_3}{w_A+w_B+w_C}.
$$

这就是程序中的$\text{Fermat}$点解析坐标公式。

5. 退化情形  

若存在内角 $\ge120^\circ$，则距离和最小点退化为该角顶点。程序中也按此规则处理。

<!-- > ![](<截屏2026-03-20 17.11.21.png>) Steiner 最小树 -->

---

### 8、设计总结
1. 完成情况
   - 完成题目要求的图形界面、文件读写、城市/线路增删改、连通性修复、最短路径、TSP 变形、Steiner 近似构造。
2. 工程优化与稳定性改进
   - 增加 `edgeSet` 判重，提升重复边检测效率。
   - 修复删除城市/重建图时边索引一致性问题，避免“误判重复边”。
   - 修复 $\text{Steiner}$ 重建过程中的状态同步与失败回滚逻辑，避免“显示成功但边集异常”。
   - 算法按钮在消息队列中同步执行，避免 Swing 线程安全问题。
3. 测试与结果
   - 使用 `Benchmark` 在 50/100/200/500 节点规模下完成批量性能测试。
   - 满足任务书中“测试用例不少于 200 城市”的要求。

#### Benchmark 实测结果

测试环境:
   - CPU: Apple M4
   - 内存: LPDDR5X 16GB 7500MHz
   - 操作系统: macOS 26.3.1 (a) (25D771280a)

| 规模 | Q5 连通修复 | Q6 最短路 | Q7 TSP | Q8 Steiner |
|---|---:|---:|---:|---:|
| 50  | 0.39 ms | 0.66 ms | 0.63 ms | 0.90 ms |
| 100 | 2.39 ms | 1.11 ms | 3.50 ms | 2.63 ms |
| 200 | 2.21 ms | 1.25 ms | 3.12 ms | 6.65 ms |
| 500 | 6.49 ms | 1.36 ms | 31.95 ms | 22.29 ms |

<!-- > ![alt text](<截屏2026-03-20 17.32.34.png>) Benchmark 一轮 -->

---