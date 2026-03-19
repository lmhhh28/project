package com.citygraph.view;

import javax.swing.*;
import javax.swing.border.TitledBorder;
import java.awt.*;

/**
 * The right-side control panel containing forms and buttons.
 */
public class ControlPanel extends JPanel {
    private AppController controller;

    // Form fields for City
    private JTextField cityIdField = new JTextField(5);
    private JTextField cityNameField = new JTextField(10);
    private JTextField cityXField = new JTextField(5);
    private JTextField cityYField = new JTextField(5);
    private JTextField cityDescField = new JTextField(10);

    // Form fields for Edge
    private JTextField edgeSrcField = new JTextField(5);
    private JTextField edgeTgtField = new JTextField(5);

    // Algorithm fields
    private JTextField startNodeField = new JTextField(5);

    public ControlPanel(AppController controller) {
        this.controller = controller;
        this.setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        this.setPreferredSize(new Dimension(300, 800));
        
        // 1. File IO Panel
        JPanel filePanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 5, 5));
        filePanel.setBorder(new TitledBorder("数据存取"));
        JButton btnLoad = new JButton("加载");
        JButton btnSave = new JButton("保存");
        JButton btnClear = new JButton("清空");
        filePanel.add(btnLoad);
        filePanel.add(btnSave);
        filePanel.add(btnClear);
        this.add(filePanel);

        // 2. City Config Panel
        JPanel cityPanel = new JPanel(new GridLayout(6, 2, 5, 5));
        cityPanel.setBorder(new TitledBorder("城市节点管理"));
        cityPanel.add(new JLabel("ID (整数):")); cityPanel.add(cityIdField);
        cityPanel.add(new JLabel("名 称:")); cityPanel.add(cityNameField);
        cityPanel.add(new JLabel("X 坐标:")); cityPanel.add(cityXField);
        cityPanel.add(new JLabel("Y 坐标:")); cityPanel.add(cityYField);
        cityPanel.add(new JLabel("简 介:")); cityPanel.add(cityDescField);
        
        JPanel cityBtnRow = new JPanel(new FlowLayout(FlowLayout.CENTER, 5, 5));
        JButton btnAddCity = new JButton("添加");
        JButton btnUpdCity = new JButton("修改");
        JButton btnDelCity = new JButton("删除");
        
        // Ensure all buttons exist on the same line by avoiding excessively long text
        cityBtnRow.add(btnAddCity);
        cityBtnRow.add(btnUpdCity);
        cityBtnRow.add(btnDelCity);
        this.add(cityPanel);
        this.add(cityBtnRow);

        // 3. Edge Config Panel
        JPanel edgePanel = new JPanel(new GridLayout(2, 2, 5, 5));
        edgePanel.setBorder(new TitledBorder("通信线路管理"));
        edgePanel.add(new JLabel("起点 ID:")); edgePanel.add(edgeSrcField);
        edgePanel.add(new JLabel("终点 ID:")); edgePanel.add(edgeTgtField);
        
        JPanel edgeBtnRow = new JPanel(new FlowLayout(FlowLayout.CENTER, 5, 5));
        JButton btnAddEdge = new JButton("添加线路");
        JButton btnDelEdge = new JButton("删除线路");
        edgeBtnRow.add(btnAddEdge);
        edgeBtnRow.add(btnDelEdge);
        this.add(edgePanel);
        this.add(edgeBtnRow);

        // 4. Algorithm Panel
        JPanel algPanel = new JPanel(new GridLayout(7, 1, 5, 5));
        algPanel.setBorder(new TitledBorder("算法控制台"));
        
        JPanel algInputGroup = new JPanel(new FlowLayout(FlowLayout.LEFT));
        algInputGroup.add(new JLabel("目标城市 ID:"));
        algInputGroup.add(startNodeField);
        
        JButton btnQ5 = new JButton("Q5: 检查连通性 / 生成增补网 (Kruskal)");
        JButton btnQ6 = new JButton("Q6: 计算单源最短路径 (Dijkstra)");
        JButton btnQ7Path = new JButton("Q7: 旅行商最短路线 (TSP - 不回起点)");
        JButton btnQ7Cycle = new JButton("Q7: 旅行商最短巡回 (TSP - 回到起点)");
        JButton btnQ8 = new JButton("Q8: 生成施泰纳最小树 (Steiner Tree)");
        JButton btnClearHi = new JButton("清除高亮与增补的辅助虚线");

        algPanel.add(algInputGroup);
        algPanel.add(btnQ5);
        algPanel.add(btnQ6);
        algPanel.add(btnQ7Path);
        algPanel.add(btnQ7Cycle);
        algPanel.add(btnQ8);
        algPanel.add(btnClearHi);
        this.add(algPanel);

        // Set up Listeners
        btnLoad.addActionListener(e -> {
            JFileChooser chooser = new JFileChooser(".");
            if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
                controller.loadFromFile(chooser.getSelectedFile().getAbsolutePath());
            }
        });
        btnSave.addActionListener(e -> {
            JFileChooser chooser = new JFileChooser(".");
            if (chooser.showSaveDialog(this) == JFileChooser.APPROVE_OPTION) {
                controller.saveToFile(chooser.getSelectedFile().getAbsolutePath());
            }
        });
        btnClear.addActionListener(e -> controller.clearGraph());
        
        btnAddCity.addActionListener(e -> processCityAction("ADD"));
        btnUpdCity.addActionListener(e -> processCityAction("UPD"));
        btnDelCity.addActionListener(e -> {
            try {
                int id = Integer.parseInt(cityIdField.getText().trim());
                controller.removeCity(id);
            } catch (NumberFormatException ex) {
                log("删除城市失败：请输入有效的数字ID。");
            }
        });

        btnAddEdge.addActionListener(e -> processEdgeAction("ADD"));
        btnDelEdge.addActionListener(e -> processEdgeAction("DEL"));

        btnQ5.addActionListener(e -> controller.checkConnectivityAndFix());
        btnQ6.addActionListener(e -> {
            try {
                int id = Integer.parseInt(startNodeField.getText().trim());
                controller.findShortestPath(id);
            } catch (Exception ex) {
                log("请输入正确的目标城市ID作为起点。");
            }
        });
        btnQ7Path.addActionListener(e -> {
            try {
                int id = Integer.parseInt(startNodeField.getText().trim());
                controller.solveTSP(id, false);
            } catch (Exception ex) {
                log("请输入正确的目标城市ID作为起点。");
            }
        });
        btnQ7Cycle.addActionListener(e -> {
            try {
                int id = Integer.parseInt(startNodeField.getText().trim());
                controller.solveTSP(id, true);
            } catch (Exception ex) {
                log("请输入正确的目标城市ID作为起点。");
            }
        });
        btnQ8.addActionListener(e -> controller.buildSteinerTree());
        btnClearHi.addActionListener(e -> controller.clearHighlights());
    }

    private void processCityAction(String action) {
        try {
            int id = Integer.parseInt(cityIdField.getText().trim());
            String name = cityNameField.getText().trim();
            int x = Integer.parseInt(cityXField.getText().trim());
            int y = Integer.parseInt(cityYField.getText().trim());
            String desc = cityDescField.getText().trim();
            if (name.isEmpty()) {
                log("城市名称不能为空，请输入名称。");
                return;
            }
            if (action.equals("ADD")) {
                controller.addCity(id, name, x, y, desc);
            } else {
                controller.updateCity(id, name, x, y, desc);
            }
        } catch (NumberFormatException e) {
            log("城市表单包含无效的数字格式，请检查。");
        }
    }

    private void processEdgeAction(String action) {
        try {
            int src = Integer.parseInt(edgeSrcField.getText().trim());
            int tgt = Integer.parseInt(edgeTgtField.getText().trim());
            if (action.equals("ADD")) controller.addEdge(src, tgt);
            else controller.removeEdge(src, tgt);
        } catch (NumberFormatException e) {
            log("线路表单包含无效的数字格式，请检查。");
        }
    }

    public void log(String msg) {
        controller.log(msg);
    }
    
    public void fillCityForm(int id, String name, int x, int y, String desc) {
        cityIdField.setText(String.valueOf(id));
        cityNameField.setText(name);
        cityXField.setText(String.valueOf(x));
        cityYField.setText(String.valueOf(y));
        cityDescField.setText(desc);
    }
}
