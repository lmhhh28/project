package com.citygraph.view;

/**
 * Common AppController interface for View to trigger actions.
 */
public interface AppController {
    void onCityClicked(com.citygraph.model.City city);
    
    // Commands triggered from ControlPanel
    void addCity(int id, String name, int x, int y, String desc);
    void updateCity(int id, String name, int x, int y, String desc);
    void removeCity(int id);
    
    void addEdge(int sourceId, int targetId);
    void removeEdge(int sourceId, int targetId);
    
    void loadFromFile(String path);
    void saveToFile(String path);
    
    void checkConnectivityAndFix();
    void findShortestPath(int sourceId);
    void solveTSP(int startCityId, boolean returnToStart);
    void buildSteinerTree();
    
    void clearHighlights();
    void clearGraph();
}
