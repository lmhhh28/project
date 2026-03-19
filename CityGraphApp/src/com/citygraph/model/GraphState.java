package com.citygraph.model;

import java.util.*;

/**
 * Stores the core graph representation of cities and edges.
 */
public class GraphState {
    private Map<Integer, City> cities;
    private List<Edge> edges;
    private Set<Edge> edgeSet; // O(1) duplicate check
    
    // Backup for original edges destroyed during Steiner generation
    private List<Edge> backedUpEdges;
    
    // For fast retrieval of adjacent edges
    private Map<Integer, List<Edge>> adjacencyList;
    
    private int nextCityId = 1;

    public GraphState() {
        this.cities = new HashMap<>();
        this.edges = new ArrayList<>();
        this.edgeSet = new HashSet<>();
        this.backedUpEdges = new ArrayList<>();
        this.adjacencyList = new HashMap<>();
    }

    public Collection<City> getCities() {
        return cities.values();
    }
    
    public City getCity(int id) {
        return cities.get(id);
    }

    public List<Edge> getEdges() {
        return edges;
    }

    public void addCity(City city) {
        if (!cities.containsKey(city.getId())) {
            cities.put(city.getId(), city);
            adjacencyList.putIfAbsent(city.getId(), new ArrayList<>());
            if (city.getId() >= nextCityId) {
                nextCityId = city.getId() + 1;
            }
        }
    }

    public int getNextCityId() {
        return nextCityId;
    }

    public void removeCity(int id) {
        if (cities.containsKey(id)) {
            cities.remove(id);
            adjacencyList.remove(id);
            // Remove any connected edges
            Iterator<Edge> iterator = edges.iterator();
            while (iterator.hasNext()) {
                Edge e = iterator.next();
                if (e.getSourceId() == id || e.getTargetId() == id) {
                    iterator.remove();
                    edgeSet.remove(e);
                    // Also remove from other city's adjacency list
                    int otherId = e.getOtherId(id);
                    if (adjacencyList.containsKey(otherId)) {
                        adjacencyList.get(otherId).remove(e);
                    }
                }
            }
        }
    }

    public boolean addEdge(Edge edge) {
        // Ensure both cities exist
        if (!cities.containsKey(edge.getSourceId()) || !cities.containsKey(edge.getTargetId())) {
            return false;
        }
        // Ensure simple graph (no duplicate edges, no self-loops)
        if (edge.getSourceId() == edge.getTargetId()) {
            return false;
        }
        if (edgeSet.contains(edge)) {
            return false; // already exists
        }

        // Calculate length using Euclidean distance only if not pre-set
        if (edge.getLength() == 0) {
            City source = cities.get(edge.getSourceId());
            City target = cities.get(edge.getTargetId());
            int dx = source.getX() - target.getX();
            int dy = source.getY() - target.getY();
            edge.setLength((int) Math.round(Math.sqrt(dx * dx + dy * dy)));
        }

        edges.add(edge);
        edgeSet.add(edge);
        adjacencyList.computeIfAbsent(edge.getSourceId(), k -> new ArrayList<>()).add(edge);
        adjacencyList.computeIfAbsent(edge.getTargetId(), k -> new ArrayList<>()).add(edge);
        return true;
    }

    public boolean removeEdge(int sourceId, int targetId) {
        Edge temp = new Edge(sourceId, targetId);
        if (edges.remove(temp)) {
            edgeSet.remove(temp);
            if (adjacencyList.containsKey(sourceId)) {
                adjacencyList.get(sourceId).removeIf(e -> e.equals(temp));
            }
            if (adjacencyList.containsKey(targetId)) {
                adjacencyList.get(targetId).removeIf(e -> e.equals(temp));
            }
            return true;
        }
        return false;
    }
    
    public void clearAllVirtualAndHighlightedEdges() {
        edges.removeIf(e -> e.isVirtual() || e.isSteiner());
        for (Edge e : edges) {
            e.setHighlighted(false);
        }
        
        // Restore backed up edges if they exist
        if (!backedUpEdges.isEmpty()) {
            edges.addAll(backedUpEdges);
            backedUpEdges.clear();
        }
        
        // Removed Steiner cities if any
        cities.entrySet().removeIf(entry -> entry.getValue().getName().startsWith("Steiner_"));
        
        // Rebuild indexes to avoid stale refs
        rebuildAdjacencyList();
    }
    
    public void backupOriginalEdges() {
        List<Edge> snapshot = new ArrayList<>();
        for (Edge e : edges) {
            if (!e.isSteiner() && !e.isVirtual()) {
                snapshot.add(e);
            }
        }
        // If we are currently looking at a generated Steiner-only graph, keep the last real snapshot.
        if (!snapshot.isEmpty() || backedUpEdges.isEmpty()) {
            backedUpEdges.clear();
            backedUpEdges.addAll(snapshot);
        }
    }
    
    public void clearHighlightedEdges() {
        for (Edge e : edges) {
            e.setHighlighted(false);
        }
    }
    
    public void rebuildAdjacencyList() {
        edgeSet.clear();
        adjacencyList.clear();
        for (Integer id : cities.keySet()) {
            adjacencyList.put(id, new ArrayList<>());
        }
        for (Edge e : edges) {
            edgeSet.add(e);
            adjacencyList.computeIfAbsent(e.getSourceId(), k -> new ArrayList<>()).add(e);
            adjacencyList.computeIfAbsent(e.getTargetId(), k -> new ArrayList<>()).add(e);
        }
    }

    public List<Edge> getAdjacentEdges(int cityId) {
        return adjacencyList.getOrDefault(cityId, Collections.emptyList());
    }
    
    public int calculateDistance(City c1, City c2) {
        int dx = c1.getX() - c2.getX();
        int dy = c1.getY() - c2.getY();
        return (int) Math.round(Math.sqrt(dx * dx + dy * dy));
    }
    
    /**
     * Recalculate edge lengths for all edges connected to a given city.
     * Should be called after updating a city's coordinates.
     */
    public void recalculateEdgeLengths(int cityId) {
        City c = cities.get(cityId);
        if (c == null) return;
        for (Edge e : getAdjacentEdges(cityId)) {
            City other = cities.get(e.getOtherId(cityId));
            if (other != null) {
                int dx = c.getX() - other.getX();
                int dy = c.getY() - other.getY();
                e.setLength((int) Math.round(Math.sqrt(dx * dx + dy * dy)));
            }
        }
    }

    public void clear() {
        cities.clear();
        edges.clear();
        edgeSet.clear();
        backedUpEdges.clear();
        adjacencyList.clear();
        nextCityId = 1;
    }
}
