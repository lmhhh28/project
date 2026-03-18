package com.citygraph.view;

import com.citygraph.algorithm.AlgorithmEngine;
import com.citygraph.controller.FileManager;
import com.citygraph.model.City;
import com.citygraph.model.GraphState;

import javax.swing.*;
import java.awt.*;
import java.io.IOException;

/**
 * Main application window weaving Model, View, and Controller together.
 */
public class MainFrame extends JFrame implements AppController {
    
    private GraphState graph;
    private GraphCanvas canvas;
    private ControlPanel controlPanel;

    public MainFrame() {
        super("城市通信网络规划系统");
        this.graph = new GraphState();
        
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.setSize(1200, 800);
        this.setLayout(new BorderLayout());

        this.canvas = new GraphCanvas(graph, this);
        this.controlPanel = new ControlPanel(this);

        this.add(canvas, BorderLayout.CENTER);
        this.add(controlPanel, BorderLayout.EAST);
    }

    private void refreshCanvas() {
        canvas.repaint();
    }

    @Override
    public void onCityClicked(City city) {
        controlPanel.log("已点击: " + city.toString());
        controlPanel.fillCityForm(city.getId(), city.getName(), city.getX(), city.getY(), city.getDescription());
    }

    @Override
    public void addCity(int id, String name, int x, int y, String desc) {
        City c = new City(id, name, x, y, desc);
        graph.addCity(c);
        controlPanel.log("已添加城市: " + c.getName());
        refreshCanvas();
    }

    @Override
    public void updateCity(int id, String name, int x, int y, String desc) {
        City c = graph.getCity(id);
        if (c != null) {
            c.setName(name);
            c.setX(x);
            c.setY(y);
            c.setDescription(desc);
            // Recalculate edge lengths matching this city, if it moved
            graph.recalculateEdgeLengths(id);
            controlPanel.log("已更新城市: " + name);
            refreshCanvas();
        } else {
            controlPanel.log("更新失败，未找到城市ID: " + id);
        }
    }

    @Override
    public void removeCity(int id) {
        if (graph.getCity(id) != null) {
            graph.removeCity(id);
            controlPanel.log("已删除城市ID: " + id);
            refreshCanvas();
        } else {
            controlPanel.log("删除失败，未找到城市ID: " + id);
        }
    }

    @Override
    public void addEdge(int sourceId, int targetId) {
        if (graph.addEdge(new com.citygraph.model.Edge(sourceId, targetId))) {
            controlPanel.log("已添加线路: " + sourceId + " <-> " + targetId);
            refreshCanvas();
        } else {
            controlPanel.log("添加线路失败。请检查ID是否正确或线路已存在。");
        }
    }

    @Override
    public void removeEdge(int sourceId, int targetId) {
        graph.removeEdge(sourceId, targetId);
        controlPanel.log("已尝试删除线路: " + sourceId + " <-> " + targetId);
        refreshCanvas();
    }

    @Override
    public void loadFromFile(String path) {
        try {
            graph = FileManager.loadGraph(path);
            canvas = new GraphCanvas(graph, this);
            
            this.getContentPane().removeAll();
            this.add(canvas, BorderLayout.CENTER);
            this.add(controlPanel, BorderLayout.EAST);
            
            this.revalidate();
            refreshCanvas();
            controlPanel.log("已从文件加载图数据：" + path);
        } catch (IOException e) {
            controlPanel.log("加载文件错误: " + e.getMessage());
        }
    }

    @Override
    public void saveToFile(String path) {
        try {
            FileManager.saveGraph(graph, path);
            controlPanel.log("已保存图数据到：" + path);
        } catch (IOException e) {
            controlPanel.log("保存文件错误: " + e.getMessage());
        }
    }

    @Override
    public void clearGraph() {
        graph.clear();
        refreshCanvas();
        controlPanel.log("画布与图数据已清空。");
    }

    @Override
    public void checkConnectivityAndFix() {
        clearHighlights();
        AlgorithmEngine.checkConnectivityAndFix(graph, msg -> controlPanel.log(msg));
        refreshCanvas();
    }

    @Override
    public void findShortestPath(int sourceId) {
        clearHighlights();
        AlgorithmEngine.findShortestPath(graph, sourceId, msg -> controlPanel.log(msg));
        refreshCanvas();
    }

    @Override
    public void solveTSP(int startCityId, boolean returnToStart) {
        clearHighlights();
        AlgorithmEngine.solveTSP(graph, startCityId, returnToStart, msg -> controlPanel.log(msg));
        refreshCanvas();
    }

    @Override
    public void buildSteinerTree() {
        clearHighlights();
        AlgorithmEngine.buildSteinerTree(graph, msg -> controlPanel.log(msg));
        refreshCanvas();
    }

    @Override
    public void clearHighlights() {
        graph.clearAllVirtualAndHighlightedEdges();
        refreshCanvas();
    }
}
