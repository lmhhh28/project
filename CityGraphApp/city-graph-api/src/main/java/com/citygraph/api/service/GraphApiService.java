package com.citygraph.api.service;

import com.citygraph.algorithm.AlgorithmEngine;
import com.citygraph.api.dto.AlgorithmResultDto;
import com.citygraph.api.dto.CityDto;
import com.citygraph.api.dto.EdgeDto;
import com.citygraph.api.dto.GraphDto;
import com.citygraph.api.dto.GraphSummaryDto;
import com.citygraph.api.dto.ImportResultDto;
import com.citygraph.api.dto.request.CreateCityRequest;
import com.citygraph.api.dto.request.CreateEdgeRequest;
import com.citygraph.api.dto.request.UpdateCityRequest;
import com.citygraph.api.exception.BadRequestException;
import com.citygraph.api.exception.NotFoundException;
import com.citygraph.controller.FileManager;
import com.citygraph.model.City;
import com.citygraph.model.Edge;
import com.citygraph.model.GraphState;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
public class GraphApiService {

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private GraphState graph = new GraphState();

    public GraphDto getGraph() {
        lock.readLock().lock();
        try {
            return toGraphDto(graph);
        } finally {
            lock.readLock().unlock();
        }
    }

    public GraphDto clearGraph() {
        lock.writeLock().lock();
        try {
            graph.clear();
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GraphDto clearHighlightsAndVirtuals() {
        lock.writeLock().lock();
        try {
            graph.clearAllVirtualAndHighlightedEdges();
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GraphDto addCity(CreateCityRequest req) {
        lock.writeLock().lock();
        try {
            if (graph.getCity(req.id()) != null) {
                throw new BadRequestException("City ID already exists: " + req.id());
            }

            City city = new City(
                    req.id(),
                    req.name().trim(),
                    req.x(),
                    req.y(),
                    req.description() == null ? "" : req.description().trim()
            );
            graph.addCity(city);
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GraphDto updateCity(int cityId, UpdateCityRequest req) {
        lock.writeLock().lock();
        try {
            City city = graph.getCity(cityId);
            if (city == null) {
                throw new NotFoundException("City not found: " + cityId);
            }

            city.setName(req.name().trim());
            city.setX(req.x());
            city.setY(req.y());
            city.setDescription(req.description() == null ? "" : req.description().trim());
            graph.recalculateEdgeLengths(cityId);
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GraphDto removeCity(int cityId) {
        lock.writeLock().lock();
        try {
            if (graph.getCity(cityId) == null) {
                throw new NotFoundException("City not found: " + cityId);
            }
            graph.removeCity(cityId);
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GraphDto addEdge(CreateEdgeRequest req) {
        lock.writeLock().lock();
        try {
            int sourceId = req.sourceId();
            int targetId = req.targetId();
            if (sourceId == targetId) {
                throw new BadRequestException("Self-loop is not allowed.");
            }
            if (graph.getCity(sourceId) == null || graph.getCity(targetId) == null) {
                throw new BadRequestException("Both sourceId and targetId must exist.");
            }

            boolean added = graph.addEdge(new Edge(sourceId, targetId));
            if (!added) {
                throw new BadRequestException("Edge already exists or invalid edge.");
            }
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GraphDto removeEdge(int sourceId, int targetId) {
        lock.writeLock().lock();
        try {
            boolean removed = graph.removeEdge(sourceId, targetId);
            if (!removed) {
                throw new NotFoundException("Edge not found: " + sourceId + " <-> " + targetId);
            }
            return toGraphDto(graph);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public ImportResultDto importFromTxtFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required and cannot be empty.");
        }

        Path tempPath = null;
        try {
            tempPath = Files.createTempFile("city-graph-import-", ".txt");
            file.transferTo(tempPath);
            FileManager.LoadResult loadResult = FileManager.loadGraph(tempPath.toString());

            lock.writeLock().lock();
            try {
                graph = loadResult.graph;
                return new ImportResultDto(List.copyOf(loadResult.warnings), toGraphDto(graph));
            } finally {
                lock.writeLock().unlock();
            }
        } catch (IOException ex) {
            throw new BadRequestException("Failed to import file: " + ex.getMessage());
        } finally {
            if (tempPath != null) {
                try {
                    Files.deleteIfExists(tempPath);
                } catch (IOException ignored) {
                    // no-op
                }
            }
        }
    }

    public String exportToTxt() {
        Path tempPath = null;
        try {
            tempPath = Files.createTempFile("city-graph-export-", ".txt");
            lock.readLock().lock();
            try {
                FileManager.saveGraph(graph, tempPath.toString());
            } finally {
                lock.readLock().unlock();
            }
            return Files.readString(tempPath, StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to export graph: " + ex.getMessage(), ex);
        } finally {
            if (tempPath != null) {
                try {
                    Files.deleteIfExists(tempPath);
                } catch (IOException ignored) {
                    // no-op
                }
            }
        }
    }

    public AlgorithmResultDto runConnectivityFix() {
        lock.writeLock().lock();
        try {
            graph.clearAllVirtualAndHighlightedEdges();
            List<String> logs = new ArrayList<>();
            AlgorithmEngine.checkConnectivityAndFix(graph, logs::add);
            return new AlgorithmResultDto("Q5_CONNECTIVITY_FIX", logs, toGraphDto(graph));
        } finally {
            lock.writeLock().unlock();
        }
    }

    public AlgorithmResultDto runShortestPath(int sourceId) {
        lock.writeLock().lock();
        try {
            if (graph.getCity(sourceId) == null) {
                throw new NotFoundException("City not found: " + sourceId);
            }
            graph.clearAllVirtualAndHighlightedEdges();
            List<String> logs = new ArrayList<>();
            AlgorithmEngine.findShortestPath(graph, sourceId, logs::add);
            return new AlgorithmResultDto("Q6_SHORTEST_PATH", logs, toGraphDto(graph));
        } finally {
            lock.writeLock().unlock();
        }
    }

    public AlgorithmResultDto runTsp(int startCityId, boolean returnToStart) {
        lock.writeLock().lock();
        try {
            if (graph.getCity(startCityId) == null) {
                throw new NotFoundException("City not found: " + startCityId);
            }
            graph.clearAllVirtualAndHighlightedEdges();
            List<String> logs = new ArrayList<>();
            AlgorithmEngine.solveTSP(graph, startCityId, returnToStart, logs::add);
            return new AlgorithmResultDto("Q7_TSP", logs, toGraphDto(graph));
        } finally {
            lock.writeLock().unlock();
        }
    }

    public AlgorithmResultDto runSteinerTree() {
        lock.writeLock().lock();
        try {
            graph.clearAllVirtualAndHighlightedEdges();
            List<String> logs = new ArrayList<>();
            AlgorithmEngine.buildSteinerTree(graph, logs::add);
            return new AlgorithmResultDto("Q8_STEINER_TREE", logs, toGraphDto(graph));
        } finally {
            lock.writeLock().unlock();
        }
    }

    private GraphDto toGraphDto(GraphState graphState) {
        List<CityDto> cities = graphState.getCities()
                .stream()
                .map(c -> new CityDto(c.getId(), c.getName(), c.getX(), c.getY(), c.getDescription()))
                .sorted(Comparator.comparingInt(CityDto::id))
                .toList();

        List<EdgeDto> edges = graphState.getEdges()
                .stream()
                .map(e -> new EdgeDto(
                        e.getSourceId(),
                        e.getTargetId(),
                        e.getLength(),
                        e.isVirtual(),
                        e.isHighlighted(),
                        e.isSteiner()
                ))
                .sorted(Comparator
                        .comparingInt((EdgeDto e) -> Math.min(e.sourceId(), e.targetId()))
                        .thenComparingInt(e -> Math.max(e.sourceId(), e.targetId())))
                .toList();

        int virtualEdges = 0;
        int steinerEdges = 0;
        for (EdgeDto edge : edges) {
            if (edge.virtual()) {
                virtualEdges++;
            }
            if (edge.steiner()) {
                steinerEdges++;
            }
        }

        int edgeCount = edges.size();
        int realEdges = edgeCount - virtualEdges - steinerEdges;

        GraphSummaryDto summary = new GraphSummaryDto(
                cities.size(),
                edgeCount,
                Math.max(realEdges, 0),
                virtualEdges,
                steinerEdges
        );
        return new GraphDto(cities, edges, summary);
    }
}
