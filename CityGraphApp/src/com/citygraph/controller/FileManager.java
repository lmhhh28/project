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
                String name = escapeCsv(city.getName());
                String desc = escapeCsv(city.getDescription());
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
     * Result of loading a graph, containing the graph and any parse warnings.
     */
    public static class LoadResult {
        public final GraphState graph;
        public final java.util.List<String> warnings;
        
        public LoadResult(GraphState graph, java.util.List<String> warnings) {
            this.graph = graph;
            this.warnings = warnings;
        }
    }

    /**
     * Loads the GraphState from the specified file.
     * Returns a LoadResult containing the graph and any parse warnings.
     */
    public static LoadResult loadGraph(String filePath) throws IOException {
        GraphState graph = new GraphState();
        java.util.List<String> warnings = new java.util.ArrayList<>();
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
                    String[] parts = parseCsvLine(line);
                    if (parts.length >= 4) {
                        try {
                            int id = Integer.parseInt(parts[0]);
                            String name = parts[1];
                            int x = Integer.parseInt(parts[2]);
                            int y = Integer.parseInt(parts[3]);
                            String desc = parts.length > 4 ? parts[4] : "";
                            graph.addCity(new City(id, name, x, y, desc));
                        } catch (NumberFormatException e) {
                            warnings.add("跳过无效的城市行: " + line);
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
                            warnings.add("跳过无效的线路行: " + line);
                        }
                    }
                }
            }
        }
        return new LoadResult(graph, warnings);
    }

    private static String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private static String[] parseCsvLine(String line) {
        java.util.List<String> tokens = new java.util.ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i+1) == '"') {
                    sb.append('"'); i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString());
        return tokens.toArray(new String[0]);
    }
}
