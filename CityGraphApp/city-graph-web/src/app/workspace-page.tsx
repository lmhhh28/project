import { Suspense, lazy, startTransition } from "react";
import { Alert, Card, Spin, Tabs } from "antd";
import "@/app/workspace-page.css";
import { HeaderBar } from "@/components/header-bar";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { LogPanel } from "@/components/log-panel";
import { SelectionSummary } from "@/components/selection-summary";
import { AlgorithmPanel } from "@/components/panels/algorithm-panel";
import { CityPanel } from "@/components/panels/city-panel";
import { EdgePanel } from "@/components/panels/edge-panel";
import { FilePanel } from "@/components/panels/file-panel";
import { useCityGraphWorkspace } from "@/hooks/use-city-graph-workspace";
import { getCityById, getEdgeByKey } from "@/lib/graph";
import { useUiStore } from "@/store/ui-store";

const HelpPanel = lazy(() => import("@/components/help/help-panel"));

export function WorkspacePage() {
  const selectedEntity = useUiStore((state) => state.selectedEntity);
  const logs = useUiStore((state) => state.logs);
  const clearLogs = useUiStore((state) => state.clearLogs);
  const isHelpOpen = useUiStore((state) => state.isHelpOpen);
  const setHelpOpen = useUiStore((state) => state.setHelpOpen);
  const selectCity = useUiStore((state) => state.selectCity);
  const selectEdge = useUiStore((state) => state.selectEdge);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const viewport = useUiStore((state) => state.viewport);
  const setViewport = useUiStore((state) => state.setViewport);
  const resetViewport = useUiStore((state) => state.resetViewport);
  const legend = useUiStore((state) => state.legend);
  const toggleLegend = useUiStore((state) => state.toggleLegend);

  const {
    apiBaseUrl,
    graph,
    graphQuery,
    health,
    healthQuery,
    latestImportWarnings,
    pendingAction,
    refreshGraph,
    refreshHealth,
    addCity,
    updateCity,
    removeCity,
    addEdge,
    removeEdge,
    clearGraph,
    clearHighlights,
    importGraph,
    exportGraph,
    runConnectivityFix,
    runShortestPath,
    runTsp,
    runSteinerTree,
  } = useCityGraphWorkspace();

  const selectedCity = selectedEntity.type === "city" ? getCityById(graph, selectedEntity.cityId) : undefined;
  const selectedEdge = selectedEntity.type === "edge" ? getEdgeByKey(graph, selectedEntity.edgeKey) : undefined;

  return (
    <div className="workspace-page">
      <HeaderBar
        apiBaseUrl={apiBaseUrl}
        health={health}
        healthError={healthQuery.isError}
        healthLoading={healthQuery.isFetching || pendingAction === "refreshHealth"}
        graphLoading={graphQuery.isFetching || pendingAction === "refreshGraph"}
        onRefreshHealth={() => {
          void refreshHealth();
        }}
        onRefreshGraph={() => {
          void refreshGraph();
        }}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="workspace-main">
        <Card className="workspace-canvas-card glass-card" variant="borderless">
          {graphQuery.isError ? (
            <div className="panel-section">
              <Alert
                type="error"
                showIcon
                message="图数据加载失败"
                description="请确认 `city-graph-api` 已启动，或检查 VITE_API_BASE_URL 配置。"
              />
            </div>
          ) : null}

          <GraphCanvas
            graph={graph}
            selectedEntity={selectedEntity}
            legend={legend}
            viewport={viewport}
            loading={graphQuery.isLoading}
            onSelectCity={(cityId) => {
              startTransition(() => selectCity(cityId));
            }}
            onSelectEdge={(selectedEdgeKey) => {
              startTransition(() => selectEdge(selectedEdgeKey));
            }}
            onClearSelection={clearSelection}
            onViewportChange={setViewport}
            onResetViewport={resetViewport}
            onToggleLegend={toggleLegend}
          />
        </Card>

        <div className="workspace-side-column">
          <SelectionSummary graph={graph} selectedCity={selectedCity} selectedEdge={selectedEdge} />

          <Card className="workspace-side-card glass-card" variant="borderless">
            <Tabs
              className="workspace-tabs"
              items={[
                {
                  key: "city",
                  label: "城市管理",
                  children: (
                    <CityPanel
                      graph={graph}
                      selectedCity={selectedCity}
                      pendingAction={pendingAction}
                      onSelectCity={(cityId) => {
                        startTransition(() => selectCity(cityId));
                      }}
                      onCreateCity={addCity}
                      onUpdateCity={updateCity}
                      onRemoveCity={removeCity}
                      onCloseEditor={clearSelection}
                    />
                  ),
                },
                {
                  key: "edge",
                  label: "线路管理",
                  children: (
                    <EdgePanel
                      graph={graph}
                      selectedEdge={selectedEdge}
                      pendingAction={pendingAction}
                      onSelectEdge={(selectedEdgeKey) => {
                        startTransition(() => selectEdge(selectedEdgeKey));
                      }}
                      onCreateEdge={addEdge}
                      onRemoveEdge={removeEdge}
                    />
                  ),
                },
                {
                  key: "algorithm",
                  label: "算法控制台",
                  children: (
                    <AlgorithmPanel
                      graph={graph}
                      selectedCity={selectedCity}
                      pendingAction={pendingAction}
                      onRunConnectivityFix={runConnectivityFix}
                      onRunShortestPath={(sourceId) => runShortestPath({ sourceId })}
                      onRunTsp={(startCityId, returnToStart) => runTsp({ startCityId, returnToStart })}
                      onRunSteinerTree={runSteinerTree}
                      onClearHighlights={clearHighlights}
                    />
                  ),
                },
                {
                  key: "file",
                  label: "文件操作",
                  children: (
                    <FilePanel
                      warnings={latestImportWarnings}
                      pendingAction={pendingAction}
                      onImportGraph={importGraph}
                      onExportGraph={exportGraph}
                      onClearGraph={clearGraph}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      <LogPanel logs={logs} onClear={clearLogs} />

      {isHelpOpen ? (
        <Suspense
          fallback={
            <Card className="glass-card">
              <div className="panel-section">
                <Spin />
              </div>
            </Card>
          }
        >
          <HelpPanel open={isHelpOpen} apiBaseUrl={apiBaseUrl} onClose={() => setHelpOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}
