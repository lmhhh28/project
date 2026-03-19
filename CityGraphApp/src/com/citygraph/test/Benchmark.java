package com.citygraph.test;

import com.citygraph.algorithm.AlgorithmEngine;
import com.citygraph.model.City;
import com.citygraph.model.Edge;
import com.citygraph.model.GraphState;

import java.util.Random;
import java.util.function.Consumer;

public class Benchmark {

    // A logger that does nothing to prevent console I/O from skewing performance
    private static final Consumer<String> SILENT_LOGGER = msg -> {};

    public static void main(String[] args) {
        System.out.println("=========================================");
        System.out.println("   CityGraph Algorithm Benchmark Suite   ");
        System.out.println("=========================================\n");

        int[] scales = {50, 100, 200, 500};

        for (int n : scales) {
            runBenchmarkScale(n);
        }
    }

    private static void runBenchmarkScale(int n) {
        System.out.println(String.format(">> Running Benchmark for N = %d Cities", n));
        System.out.println("-----------------------------------------");

        System.out.println(String.format("Using graphs with %d cities (fresh graph per algorithm).", n));

        // We run multiple iterations to let JIT warmup and take average
        int warmupRuns = 2;
        int benchmarkRuns = 5;

        // Q5: Kruskal's Connectivity (fresh graph each run)
        benchmarkAlgorithm("Q5 (Connectivity & Kruskal)", n, g -> {
            AlgorithmEngine.checkConnectivityAndFix(g, SILENT_LOGGER);
        }, warmupRuns, benchmarkRuns);

        // Q6: Dijkstra Shortest Path (from City #1 to all)
        benchmarkAlgorithm("Q6 (Dijkstra Shortest Path)", n, g -> {
            AlgorithmEngine.findShortestPath(g, 1, SILENT_LOGGER);
        }, warmupRuns, benchmarkRuns);

        // Q7: TSP (Exact DP / Nearest Neighbor)
        benchmarkAlgorithm("Q7 (TSP Full Cycle)", n, g -> {
            AlgorithmEngine.solveTSP(g, 1, true, SILENT_LOGGER);
        }, 1, 3); // Fewer runs for TSP due to high complexity

        // Q8: Steiner Tree Approximation
        benchmarkAlgorithm("Q8 (Steiner Tree Approx)", n, g -> {
            AlgorithmEngine.buildSteinerTree(g, SILENT_LOGGER);
        }, 1, 3);

        System.out.println("\n");
        // Force GC between scale tests for fairer memory reading
        System.gc();
        try { Thread.sleep(500); } catch (InterruptedException e) {}
    }

    private static void benchmarkAlgorithm(String name, int graphSize, Consumer<GraphState> algorithm, int warmups, int runs) {
        // Warmup JIT (with fresh graphs each time)
        for (int i = 0; i < warmups; i++) {
            GraphState warmupGraph = generateRandomGraph(graphSize);
            algorithm.accept(warmupGraph);
        }

        long totalTimeNs = 0;
        long maxMemUsed = 0;
        
        Runtime rt = Runtime.getRuntime();
        
        for (int i = 0; i < runs; i++) {
            GraphState freshGraph = generateRandomGraph(graphSize);
            long memBefore = rt.totalMemory() - rt.freeMemory();
            
            long startNs = System.nanoTime();
            try {
                algorithm.accept(freshGraph);
            } catch (Exception e) {
                System.out.println(String.format("%-30s | FAILED: %s", name, e.toString()));
                return;
            } catch (OutOfMemoryError e) {
                System.out.println(String.format("%-30s | FAILED: OOM", name));
                return;
            } catch (StackOverflowError e) {
                System.out.println(String.format("%-30s | FAILED: STACK OVERFLOW", name));
                return;
            }
            long endNs = System.nanoTime();
            
            long memAfter = rt.totalMemory() - rt.freeMemory();
            long memDiff = memAfter - memBefore;
            if (memDiff > maxMemUsed) maxMemUsed = memDiff;

            totalTimeNs += (endNs - startNs);
        }

        double avgTimeMs = (totalTimeNs / (double) runs) / 1_000_000.0;
        double maxMemMB = Math.max(0, maxMemUsed / (1024.0 * 1024.0));

        System.out.println(String.format("%-30s | %8.2f ms | Peak Mem +%.2f MB", name, avgTimeMs, maxMemMB));
    }

    private static GraphState generateRandomGraph(int n) {
        GraphState graph = new GraphState();
        Random rand = new Random(42); // Fixed seed for reproducibility

        // 1. Generate Cities
        for (int i = 1; i <= n; i++) {
            int x = rand.nextInt(2000) - 1000;
            int y = rand.nextInt(2000) - 1000;
            graph.addCity(new City(i, "City_" + i, x, y, "Random node"));
        }

        // 2. Generate Random Edges (Aim for ~3 average degree, i.e., 1.5N edges)
        int targetEdges = (int) (n * 1.5);
        int edgeCount = 0;
        
        while (edgeCount < targetEdges) {
            int u = rand.nextInt(n) + 1;
            int v = rand.nextInt(n) + 1;
            if (u != v) {
                boolean added = graph.addEdge(new Edge(u, v));
                if (added) edgeCount++;
            }
        }

        return graph;
    }
}
