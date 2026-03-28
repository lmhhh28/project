import { useEffect, useState } from "react";
import { ApartmentOutlined, BranchesOutlined, NodeCollapseOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Select, Space, Switch, Typography } from "antd";
import type { City, Graph } from "@/lib/api/types";
import { isSteinerCity } from "@/lib/graph";

interface AlgorithmPanelProps {
  graph: Graph;
  selectedCity?: City;
  pendingAction: string | null;
  onRunConnectivityFix: () => Promise<void>;
  onRunShortestPath: (sourceId: number) => Promise<void>;
  onRunTsp: (startCityId: number, returnToStart: boolean) => Promise<void>;
  onRunSteinerTree: () => Promise<void>;
  onClearHighlights: () => Promise<void>;
}

export function AlgorithmPanel({
  graph,
  selectedCity,
  pendingAction,
  onRunConnectivityFix,
  onRunShortestPath,
  onRunTsp,
  onRunSteinerTree,
  onClearHighlights,
}: AlgorithmPanelProps) {
  const algorithmCities = graph.cities.filter((city) => !isSteinerCity(city));
  const [startCityId, setStartCityId] = useState<number | undefined>(algorithmCities[0]?.id);
  const [returnToStart, setReturnToStart] = useState(true);
  const hasGeneratedEdges = graph.edges.some((edge) => edge.highlighted || edge.virtual || edge.steiner);

  useEffect(() => {
    if (selectedCity && !isSteinerCity(selectedCity)) {
      setStartCityId(selectedCity.id);
      return;
    }

    if (startCityId && algorithmCities.some((city) => city.id === startCityId)) {
      return;
    }

    setStartCityId(algorithmCities[0]?.id);
  }, [algorithmCities, selectedCity, startCityId]);

  const cityOptions = algorithmCities.map((city) => ({
    label: `${city.id} · ${city.name}`,
    value: city.id,
  }));

  return (
    <div className="panel-section panel-stack">
      <Alert
        className="panel-note"
        type="info"
        showIcon
        message="所有算法接口在执行前都会先清除已有高亮与生成边，语义和原桌面版保持一致。"
      />

      <Card className="panel-subcard" size="small" title="算法起点">
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Select
            placeholder="选择起点城市"
            value={startCityId}
            options={cityOptions}
            onChange={setStartCityId}
            showSearch
            optionFilterProp="label"
          />
          <Space>
            <Typography.Text>Q7 是否回到起点</Typography.Text>
            <Switch checked={returnToStart} onChange={setReturnToStart} />
          </Space>
        </Space>
      </Card>

      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Button
          block
          icon={<ApartmentOutlined />}
          loading={pendingAction === "runConnectivityFix"}
          disabled={graph.summary.cityCount === 0}
          onClick={() => onRunConnectivityFix()}
        >
          Q5 连通性修复 (Kruskal)
        </Button>

        <Button
          block
          icon={<BranchesOutlined />}
          loading={pendingAction === "runShortestPath"}
          disabled={!startCityId}
          onClick={() => {
            if (startCityId) {
              void onRunShortestPath(startCityId);
            }
          }}
        >
          Q6 单源最短路径 (Dijkstra)
        </Button>

        <Button
          block
          icon={<RadarChartOutlined />}
          loading={pendingAction === "runTspPath" || pendingAction === "runTspCycle"}
          disabled={!startCityId || algorithmCities.length < 2}
          onClick={() => {
            if (startCityId) {
              void onRunTsp(startCityId, returnToStart);
            }
          }}
        >
          Q7 旅行商 {returnToStart ? "最短巡回" : "最短路线"}
        </Button>

        <Button
          block
          icon={<NodeCollapseOutlined />}
          loading={pendingAction === "runSteinerTree"}
          disabled={algorithmCities.length < 3}
          onClick={() => onRunSteinerTree()}
        >
          Q8 Steiner Tree 近似构造
        </Button>

        <Button block loading={pendingAction === "clearHighlights"} disabled={!hasGeneratedEdges} onClick={() => onClearHighlights()}>
          清除高亮与生成边
        </Button>
      </Space>
    </div>
  );
}
