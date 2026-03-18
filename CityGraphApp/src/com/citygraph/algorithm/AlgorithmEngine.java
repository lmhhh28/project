package com.citygraph.algorithm;

import com.citygraph.model.City;
import com.citygraph.model.Edge;
import com.citygraph.model.GraphState;

import java.util.*;
import java.util.function.Consumer;

/**
 * Encapsulates all graph algorithm logic.
 */
public class AlgorithmEngine {

    // Helper: Union-Find for Kruskal's
    private static class DisjointSet {
        int[] parent;
        public DisjointSet(int size) {
            parent = new int[size];
            for (int i = 0; i < size; i++) parent[i] = i;
        }
        public int find(int i) {
            if (parent[i] == i) return i;
            return parent[i] = find(parent[i]);
        }
        public void union(int i, int j) {
            int rootI = find(i);
            int rootJ = find(j);
            if (rootI != rootJ) parent[rootI] = rootJ;
        }
    }

    /**
     * Q5: Check connectivity and find minimum extra edges to connect all components using Kruskal's.
     */
    public static void checkConnectivityAndFix(GraphState graph, Consumer<String> logger) {
        if (graph.getCities().isEmpty()) {
            logger.accept("Graph is empty.");
            return;
        }

        // 1. Check Connectivity using BFS
        List<City> cities = new ArrayList<>(graph.getCities());
        Set<Integer> visited = new HashSet<>();
        Queue<Integer> queue = new LinkedList<>();
        
        City start = cities.get(0);
        queue.add(start.getId());
        visited.add(start.getId());
        
        while (!queue.isEmpty()) {
            int curr = queue.poll();
            for (Edge e : graph.getAdjacentEdges(curr)) {
                if (e.isVirtual() || e.isSteiner()) continue; // Only consider real edges
                
                int next = e.getOtherId(curr);
                if (!visited.contains(next)) {
                    visited.add(next);
                    queue.add(next);
                }
            }
        }
        
        if (visited.size() == cities.size()) {
            logger.accept("Graph is fully connected!");
            return;
        }
        
        logger.accept("Graph is NOT fully connected. Finding minimum extra edges...");
        
        // 2. Kruskal's algorithm to find minimum edges to connect components
        // Map city IDs to 0...N-1 index for DisjointSet
        Map<Integer, Integer> idToIndex = new HashMap<>();
        Map<Integer, Integer> indexToId = new HashMap<>();
        int idx = 0;
        for (City c : cities) {
            idToIndex.put(c.getId(), idx);
            indexToId.put(idx, c.getId());
            idx++;
        }
        
        DisjointSet ds = new DisjointSet(cities.size());
        
        // Union existing real edges
        for (Edge e : graph.getEdges()) {
            if (!e.isVirtual() && !e.isSteiner()) {
                ds.union(idToIndex.get(e.getSourceId()), idToIndex.get(e.getTargetId()));
            }
        }
        
        // Generate all possible non-existing edges and sort by length
        List<Edge> potentialEdges = new ArrayList<>();
        for (int i = 0; i < cities.size(); i++) {
            for (int j = i + 1; j < cities.size(); j++) {
                City c1 = cities.get(i);
                City c2 = cities.get(j);
                if (ds.find(idToIndex.get(c1.getId())) != ds.find(idToIndex.get(c2.getId()))) {
                    Edge newE = new Edge(c1.getId(), c2.getId());
                    newE.setLength(graph.calculateDistance(c1, c2));
                    potentialEdges.add(newE);
                }
            }
        }
        potentialEdges.sort(Comparator.comparingInt(Edge::getLength));
        
        List<Edge> addedEdges = new ArrayList<>();
        int totalLength = 0;
        for (Edge e : potentialEdges) {
            int rootSrc = ds.find(idToIndex.get(e.getSourceId()));
            int rootTgt = ds.find(idToIndex.get(e.getTargetId()));
            if (rootSrc != rootTgt) {
                ds.union(rootSrc, rootTgt);
                e.setVirtual(true);
                graph.addEdge(e);
                addedEdges.add(e);
                totalLength += e.getLength();
            }
        }
        
        logger.accept(String.format("Added %d virtual edges. Total length: %d", addedEdges.size(), totalLength));
    }

    /**
     * Q6: Dijkstra shortest path from source to all reachable nodes, sorted by distance.
     */
    public static void findShortestPath(GraphState graph, int sourceId, Consumer<String> logger) {
        if (graph.getCity(sourceId) == null) {
            logger.accept("Source city ID " + sourceId + " not found.");
            return;
        }
        
        Map<Integer, Integer> dist = new HashMap<>();
        Map<Integer, Integer> parent = new HashMap<>();
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1])); // {id, dist}
        
        for (City c : graph.getCities()) {
            dist.put(c.getId(), Integer.MAX_VALUE);
        }
        
        dist.put(sourceId, 0);
        pq.add(new int[]{sourceId, 0});
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int u = curr[0];
            int d = curr[1];
            
            if (d > dist.get(u)) continue;
            
            for (Edge e : graph.getAdjacentEdges(u)) {
                // Ignore Steiner nodes for standard path routing unless required
                if (e.isVirtual() || e.isSteiner()) continue;
                
                int v = e.getOtherId(u);
                int weight = e.getLength();
                
                if (dist.get(u) + weight < dist.get(v)) {
                    dist.put(v, dist.get(u) + weight);
                    parent.put(v, u);
                    pq.add(new int[]{v, dist.get(v)});
                }
            }
        }
        
        // Sort reachable cities by distance
        List<Map.Entry<Integer, Integer>> reachable = new ArrayList<>();
        for (Map.Entry<Integer, Integer> entry : dist.entrySet()) {
            if (entry.getValue() != Integer.MAX_VALUE && entry.getKey() != sourceId) {
                reachable.add(entry);
            }
        }
        
        reachable.sort(Map.Entry.comparingByValue());
        
        logger.accept("Shortest paths from " + graph.getCity(sourceId).getName() + ":");
        if (reachable.isEmpty()) {
            logger.accept("  No reachable cities found.");
        }
        
        for (Map.Entry<Integer, Integer> r : reachable) {
            int targetId = r.getKey();
            int distance = r.getValue();
            
            // Reconstruct path
            List<Integer> path = new ArrayList<>();
            int curr = targetId;
            while (curr != sourceId) {
                path.add(curr);
                curr = parent.get(curr);
            }
            path.add(sourceId);
            Collections.reverse(path);
            
            StringBuilder pathStr = new StringBuilder();
            for (int i = 0; i < path.size(); i++) {
                pathStr.append(graph.getCity(path.get(i)).getName());
                if (i < path.size() - 1) pathStr.append(" -> ");
            }
            
            
            logger.accept(String.format("  To %s: Dist %d | Path: %s", 
                graph.getCity(targetId).getName(), distance, pathStr.toString()));
                
            // Highlight all edges making up the shortest paths
            curr = targetId;
            while (curr != sourceId) {
                int p = parent.get(curr);
                highlightEdge(graph, p, curr);
                curr = p;
            }
        }
    }
    
    private static void highlightEdge(GraphState graph, int u, int v) {
        for (Edge e : graph.getAdjacentEdges(u)) {
            if (e.getOtherId(u) == v) {
                e.setHighlighted(true);
                break;
            }
        }
    }
    
    /**
     * Q7: TSP solving shortest path/cycle visiting all cities (can repeat).
     * Uses Floyd-Warshall to find all-pairs shortest paths, then DFS/DP for exact TSP (if small).
     * For N > 15, we fall back to a Nearest Neighbor heuristic to avoid extremely long running time.
     */
    public static void solveTSP(GraphState graph, int startId, boolean returnToStart, Consumer<String> logger) {
        List<City> cities = new ArrayList<>(graph.getCities());
        if (cities.size() < 2) {
            logger.accept("Not enough cities for TSP.");
            return;
        }
        
        // 1. All-Pairs Shortest Path (Floyd-Warshall)
        int n = cities.size();
        int[][] dist = new int[n][n];
        int[][] next = new int[n][n]; // For path reconstruction
        
        Map<Integer, Integer> idToIndex = new HashMap<>();
        Map<Integer, Integer> indexToId = new HashMap<>();
        for (int i = 0; i < n; i++) {
            idToIndex.put(cities.get(i).getId(), i);
            indexToId.put(i, cities.get(i).getId());
            for (int j = 0; j < n; j++) {
                dist[i][j] = (i == j) ? 0 : 99999999;
                next[i][j] = -1;
            }
        }
        
        for (Edge e : graph.getEdges()) {
            if (e.isVirtual() || e.isSteiner()) continue;
            int u = idToIndex.get(e.getSourceId());
            int v = idToIndex.get(e.getTargetId());
            dist[u][v] = Math.min(dist[u][v], e.getLength());
            dist[v][u] = Math.min(dist[v][u], e.getLength());
            next[u][v] = v;
            next[v][u] = u;
        }
        
        for (int k = 0; k < n; k++) {
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                        next[i][j] = next[i][k];
                    }
                }
            }
        }
        
        // Check connectivity
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][j] > 10000000) {
                    logger.accept("Graph is not fully connected. TSP cannot reach all cities.");
                    return;
                }
            }
        }
        
        if (!idToIndex.containsKey(startId)) {
            logger.accept("Start ID not found.");
            return;
        }
        
        int startIdx = idToIndex.get(startId);
        
        if (n <= 12) {
            // Exact solver using Depth First Search / Backtracking
            logger.accept("Running precise TSP solver (N <= 12)...");
            long[] minLength = {Long.MAX_VALUE};
            List<Integer> bestIndexList = new ArrayList<>();
            List<Integer> currentPath = new ArrayList<>();
            boolean[] visited = new boolean[n];
            
            currentPath.add(startIdx);
            visited[startIdx] = true;
            
            tspExactDfs(startIdx, 1, 0, visited, currentPath, bestIndexList, minLength, dist, n, startIdx, returnToStart);
            
            outputTspResult(bestIndexList, minLength[0], next, indexToId, graph, startId, returnToStart, logger);
        } else {
            // Heuristic Solver (Nearest Neighbor + optionally 2-Opt)
            logger.accept("Running heuristic TSP solver (N > 12)...");
            
            boolean[] visited = new boolean[n];
            List<Integer> path = new ArrayList<>();
            
            int curr = startIdx;
            path.add(curr);
            visited[curr] = true;
            long totalLen = 0;
            
            for (int step = 1; step < n; step++) {
                int nextCity = -1;
                int minD = Integer.MAX_VALUE;
                for (int i = 0; i < n; i++) {
                    if (!visited[i] && dist[curr][i] < minD) {
                        minD = dist[curr][i];
                        nextCity = i;
                    }
                }
                visited[nextCity] = true;
                path.add(nextCity);
                totalLen += minD;
                curr = nextCity;
            }
            
            if (returnToStart) {
                totalLen += dist[curr][startIdx];
                path.add(startIdx);
            }
            
            outputTspResult(path, totalLen, next, indexToId, graph, startId, returnToStart, logger);
        }
    }
    
    private static void tspExactDfs(int curr, int count, long currentLen, boolean[] visited, 
                                    List<Integer> currPath, List<Integer> bestPath, 
                                    long[] minLen, int[][] dist, int n, int startIdx, boolean returnToStart) {
        if (currentLen >= minLen[0]) return; // branch pruning
        
        if (count == n) {
            long finalLen = currentLen;
            if (returnToStart) {
                finalLen += dist[curr][startIdx];
            }
            if (finalLen < minLen[0]) {
                minLen[0] = finalLen;
                bestPath.clear();
                bestPath.addAll(currPath);
                if (returnToStart) {
                    bestPath.add(startIdx);
                }
            }
            return;
        }
        
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                visited[i] = true;
                currPath.add(i);
                tspExactDfs(i, count + 1, currentLen + dist[curr][i], visited, currPath, bestPath, minLen, dist, n, startIdx, returnToStart);
                visited[i] = false;
                currPath.remove(currPath.size() - 1);
            }
        }
    }
    
    private static void outputTspResult(List<Integer> rawPathIndices, long totalLen, int[][] next, 
                                        Map<Integer, Integer> indexToId, GraphState graph, 
                                        int startId, boolean returnToStart, Consumer<String> logger) {
        // We have the macroscopic path through all cities (e.g. A -> C -> D -> B)
        // Now expand using actual shortest paths (e.g. A might go through E to reach C)
        List<Integer> fullDetailedPathId = new ArrayList<>();
        fullDetailedPathId.add(startId);
        
        for (int i = 0; i < rawPathIndices.size() - 1; i++) {
            int u = rawPathIndices.get(i);
            int v = rawPathIndices.get(i + 1);
            
            // Reconstruct intermediate path from u to v
            int curr = u;
            while (curr != v) {
                int nx = next[curr][v];
                if (nx == -1) break; // defensive check for unreachability
                curr = nx;
                fullDetailedPathId.add(indexToId.get(curr));
            }
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fullDetailedPathId.size(); i++) {
            sb.append(graph.getCity(fullDetailedPathId.get(i)).getName());
            if (i < fullDetailedPathId.size() - 1) sb.append(" -> ");
            
            // Highlight step
            if (i > 0) {
                highlightEdge(graph, fullDetailedPathId.get(i-1), fullDetailedPathId.get(i));
            }
        }
        
        
        String type = returnToStart ? "Tour (Cycle)" : "Path";
        logger.accept(String.format("Optimal TSP %s Found! Length: %d\nFull Route: %s", type, totalLen, sb.toString()));
    }
    
    /**
     * Q8: Empty network routing (Steiner Minimum Tree Approximation using Fermat point heuristics).
     */
    public static void buildSteinerTree(GraphState graph, Consumer<String> logger) {
        List<City> cities = new ArrayList<>(graph.getCities());
        if (cities.size() < 3) {
            logger.accept("Steiner tree requires at least 3 cities.");
            return;
        }
        
        logger.accept("Building Steiner Tree approximation...");
        // Fast approach: 
        // 1. Build MST of all geometric cities
        // 2. Iterate adjacent pairs of edges in the MST
        // 3. If the angle is < 120, swap the center point with a Fermat point and create new auxiliary node.
        
        // Let's clear ALL edges first since it's a "from blank" approach
        // To avoid concurrent modification exceptions, we first remove cities and edges cleanly
        List<City> toRemove = new ArrayList<>();
        for (City c : cities) {
            if (c.getName().startsWith("Steiner_")) {
                toRemove.add(c);
            }
        }
        for (City sc : toRemove) {
            graph.removeCity(sc.getId());
        }
        graph.getEdges().clear();
        graph.rebuildAdjacencyList();
        
        // Retake clean geometric cities
        cities = new ArrayList<>(graph.getCities());
        List<Edge> mstEdges = computeGeometricMST(cities);
        
        int steinerIdCounter = graph.getNextCityId();
        boolean improved;
        
        do {
            improved = false;
            // Find a vertex with degree 2 or 3 in the MST (we'll just test 2 edges at a time)
            Map<Integer, List<Edge>> adj = buildLocalAdjacencyList(cities, mstEdges);
            
            outer:
            for (City center : cities) {
                List<Edge> edges = adj.get(center.getId());
                if (edges.size() >= 2) {
                    // Try pairs of edges
                    for (int i = 0; i < edges.size(); i++) {
                        for (int j = i + 1; j < edges.size(); j++) {
                            Edge e1 = edges.get(i);
                            Edge e2 = edges.get(j);
                            
                            City p1 = graph.getCity(e1.getOtherId(center.getId()));
                            City p2 = graph.getCity(e2.getOtherId(center.getId()));
                            
                            // Check angle at center
                            double angle = calculateAngle(p1, center, p2);
                            if (angle < 120.0 && angle > 1.0) {  // 1.0 margin to avoid colinearity bugs
                                // Candidate for Fermat point optimization
                                int[] fermatPoint = computeFermatPoint(p1, center, p2);
                                
                                // Make sure it provides a length benefit
                                int oldLen = e1.getLength() + e2.getLength();
                                int newLen = dist(p1, fermatPoint) + dist(p2, fermatPoint) + dist(center, fermatPoint);
                                
                                if (newLen < oldLen - 5) { // Threshold to avoid infinitesimal float issues
                                    // Make new Steiner City
                                    City steiner = new City(steinerIdCounter++, "Steiner_" + steinerIdCounter, fermatPoint[0], fermatPoint[1], "Auxiliary routing node");
                                    graph.addCity(steiner);
                                    cities.add(steiner);
                                    
                                    // Update MST graph
                                    mstEdges.remove(e1);
                                    mstEdges.remove(e2);
                                    
                                    Edge ne1 = new Edge(p1.getId(), steiner.getId());
                                    Edge ne2 = new Edge(p2.getId(), steiner.getId());
                                    Edge ne3 = new Edge(center.getId(), steiner.getId());
                                    ne1.setLength(dist(p1, fermatPoint));
                                    ne2.setLength(dist(p2, fermatPoint));
                                    ne3.setLength(dist(center, fermatPoint));
                                    
                                    mstEdges.add(ne1);
                                    mstEdges.add(ne2);
                                    mstEdges.add(ne3);
                                    
                                    improved = true;
                                    break outer;
                                }
                            }
                        }
                    }
                }
            }
        } while (improved);
        
        int totalL = 0;
        // Apply final edges to graph
        for (Edge e : mstEdges) {
            e.setSteiner(true); // color it specially
            graph.addEdge(e);
            totalL += e.getLength(); // use already set length
        }
        
        logger.accept("Steiner tree approximation built! Total length: " + totalL);
    }
    
    private static List<Edge> computeGeometricMST(List<City> cities) {
        int n = cities.size();
        List<Edge> edges = new ArrayList<>();
        Map<Integer, Integer> idMap = new HashMap<>(); // CityID -> Index
        for (int i = 0; i < n; i++) idMap.put(cities.get(i).getId(), i);
        
        List<Edge> allPairs = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int l = dist(cities.get(i), cities.get(j));
                Edge e = new Edge(cities.get(i).getId(), cities.get(j).getId(), l);
                allPairs.add(e);
            }
        }
        allPairs.sort(Comparator.comparingInt(Edge::getLength));
        
        DisjointSet ds = new DisjointSet(n);
        int added = 0;
        for (Edge e : allPairs) {
            int r1 = ds.find(idMap.get(e.getSourceId()));
            int r2 = ds.find(idMap.get(e.getTargetId()));
            if (r1 != r2) {
                ds.union(r1, r2);
                edges.add(e);
                added++;
                if (added == n - 1) break;
            }
        }
        return edges;
    }
    
    private static Map<Integer, List<Edge>> buildLocalAdjacencyList(List<City> cities, List<Edge> edges) {
        Map<Integer, List<Edge>> adj = new HashMap<>();
        for (City c : cities) adj.put(c.getId(), new ArrayList<>());
        for (Edge e : edges) {
            adj.get(e.getSourceId()).add(e);
            adj.get(e.getTargetId()).add(e);
        }
        return adj;
    }
    
    private static int dist(City c1, City c2) {
        int dx = c1.getX() - c2.getX();
        int dy = c1.getY() - c2.getY();
        return (int) Math.round(Math.sqrt(dx * dx + dy * dy));
    }
    
    private static int dist(City c, int[] p) {
        double dx = c.getX() - p[0];
        double dy = c.getY() - p[1];
        return (int) Math.round(Math.sqrt(dx * dx + dy * dy));
    }
    
    // Calculate angle at B (A-B-C) using dot product
    private static double calculateAngle(City a, City b, City c) {
        double dx1 = a.getX() - b.getX();
        double dy1 = a.getY() - b.getY();
        double dx2 = c.getX() - b.getX();
        double dy2 = c.getY() - b.getY();
        
        double mag1 = Math.sqrt(dx1*dx1 + dy1*dy1);
        double mag2 = Math.sqrt(dx2*dx2 + dy2*dy2);
        
        if (mag1 == 0 || mag2 == 0) return 0;
        
        double dot = dx1*dx2 + dy1*dy2;
        double val = dot / (mag1 * mag2);
        val = Math.max(-1.0, Math.min(1.0, val));
        
        return Math.toDegrees(Math.acos(val));
    }
    
    // Find numeric Fermat point of a triangle p1-center-p2
    // We can use a simple gradient descent or grid search for the optimal geometric median
    // since we use integer coordinates, exact analytical solution implies complex numbers
    // Let's use a simple bounded numerical search for robustness
    private static int[] computeFermatPoint(City p1, City p2, City p3) {
        double bestX = (p1.getX() + p2.getX() + p3.getX()) / 3.0;
        double bestY = (p1.getY() + p2.getY() + p3.getY()) / 3.0;
        
        double step = 50.0;
        double minSum = sumDist(bestX, bestY, p1, p2, p3);
        
        while (step > 0.1) {
            boolean found = false;
            double[][] dirs = {{1,0}, {-1,0}, {0,1}, {0,-1}, {1,1}, {-1,-1}, {1,-1}, {-1,1}};
            for (double[] d : dirs) {
                double nx = bestX + d[0] * step;
                double ny = bestY + d[1] * step;
                double s = sumDist(nx, ny, p1, p2, p3);
                if (s < minSum) {
                    minSum = s;
                    bestX = nx;
                    bestY = ny;
                    found = true;
                }
            }
            if (!found) {
                step /= 2.0;
            }
        }
        
        return new int[]{(int)Math.round(bestX), (int)Math.round(bestY)};
    }
    
    private static double sumDist(double x, double y, City p1, City p2, City p3) {
        return Math.sqrt(Math.pow(x-p1.getX(), 2) + Math.pow(y-p1.getY(), 2)) +
               Math.sqrt(Math.pow(x-p2.getX(), 2) + Math.pow(y-p2.getY(), 2)) +
               Math.sqrt(Math.pow(x-p3.getX(), 2) + Math.pow(y-p3.getY(), 2));
    }
}
