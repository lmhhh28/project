package com.citygraph.controller;

import com.citygraph.model.City;
import com.citygraph.model.Edge;
import com.citygraph.model.GraphState;

import java.io.*;

/**
 * Handles saving and loading the graph state to/from a text file.
 */
public class FileManager {

    /**
     * Saves the GraphState to the specified file.
     * Format:
     * [CITIES]
     * id,name,x,y,description
     * ...
     * [EDGES]
     * sourceId,targetId
     * ...
     */
    public static void saveGraph(GraphState graph, String filePath) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath))) {
            writer.write("[CITIES]");
            writer.newLine();
            for (City city : graph.getCities()) {
                // Escape commas in name and description to prevent parsing errors
                String name = city.getName() != null ? city.getName().replace(",", "，") : "";
                String desc = city.getDescription() != null ? city.getDescription().replace(",", "，") : "";
                writer.write(String.format("%d,%s,%d,%d,%s", 
                    city.getId(), name, city.getX(), city.getY(), desc));
                writer.newLine();
            }

            writer.write("[EDGES]");
            writer.newLine();
            // Only save actual edges, not virtual or highlighted ones
            for (Edge edge : graph.getEdges()) {
                if (!edge.isVirtual() && !edge.isSteiner()) {
                    writer.write(String.format("%d,%d", edge.getSourceId(), edge.getTargetId()));
                    writer.newLine();
                }
            }
        }
    }

    /**
     * Loads the GraphState from the specified file.
     */
    public static GraphState loadGraph(String filePath) throws IOException {
        GraphState graph = new GraphState();
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line;
            boolean readingCities = false;
            boolean readingEdges = false;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;

                if (line.equals("[CITIES]")) {
                    readingCities = true;
                    readingEdges = false;
                    continue;
                } else if (line.equals("[EDGES]")) {
                    readingCities = false;
                    readingEdges = true;
                    continue;
                }

                if (readingCities) {
                    String[] parts = line.split(",", 5);
                    if (parts.length >= 4) {
                        try {
                            int id = Integer.parseInt(parts[0]);
                            String name = parts[1];
                            int x = Integer.parseInt(parts[2]);
                            int y = Integer.parseInt(parts[3]);
                            String desc = parts.length > 4 ? parts[4] : "";
                            graph.addCity(new City(id, name, x, y, desc));
                        } catch (NumberFormatException e) {
                            System.err.println("Error parsing city row: " + line);
                        }
                    }
                } else if (readingEdges) {
                    String[] parts = line.split(",");
                    if (parts.length >= 2) {
                        try {
                            int src = Integer.parseInt(parts[0]);
                            int tgt = Integer.parseInt(parts[1]);
                            graph.addEdge(new Edge(src, tgt));
                        } catch (NumberFormatException e) {
                            System.err.println("Error parsing edge row: " + line);
                        }
                    }
                }
            }
        }
        return graph;
    }
}
