package com.citygraph.api.controller;

import com.citygraph.api.dto.ApiResponse;
import com.citygraph.api.dto.GraphDto;
import com.citygraph.api.dto.ImportResultDto;
import com.citygraph.api.dto.request.CreateCityRequest;
import com.citygraph.api.dto.request.CreateEdgeRequest;
import com.citygraph.api.dto.request.UpdateCityRequest;
import com.citygraph.api.service.GraphApiService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/graph")
@Validated
public class GraphController {

    private final GraphApiService graphApiService;

    public GraphController(GraphApiService graphApiService) {
        this.graphApiService = graphApiService;
    }

    @GetMapping
    public ApiResponse<GraphDto> getGraph() {
        return ApiResponse.ok("Graph fetched.", graphApiService.getGraph());
    }

    @DeleteMapping
    public ApiResponse<GraphDto> clearGraph() {
        return ApiResponse.ok("Graph cleared.", graphApiService.clearGraph());
    }

    @PostMapping("/clear-highlights")
    public ApiResponse<GraphDto> clearHighlightsAndVirtuals() {
        return ApiResponse.ok("Highlights and generated edges cleared.", graphApiService.clearHighlightsAndVirtuals());
    }

    @PostMapping("/cities")
    public ApiResponse<GraphDto> addCity(@Valid @RequestBody CreateCityRequest request) {
        return ApiResponse.ok("City created.", graphApiService.addCity(request));
    }

    @PutMapping("/cities/{cityId}")
    public ApiResponse<GraphDto> updateCity(
            @PathVariable int cityId,
            @Valid @RequestBody UpdateCityRequest request
    ) {
        return ApiResponse.ok("City updated.", graphApiService.updateCity(cityId, request));
    }

    @DeleteMapping("/cities/{cityId}")
    public ApiResponse<GraphDto> removeCity(@PathVariable int cityId) {
        return ApiResponse.ok("City removed.", graphApiService.removeCity(cityId));
    }

    @PostMapping("/edges")
    public ApiResponse<GraphDto> addEdge(@Valid @RequestBody CreateEdgeRequest request) {
        return ApiResponse.ok("Edge created.", graphApiService.addEdge(request));
    }

    @DeleteMapping("/edges")
    public ApiResponse<GraphDto> removeEdge(
            @RequestParam @NotNull Integer sourceId,
            @RequestParam @NotNull Integer targetId
    ) {
        return ApiResponse.ok("Edge removed.", graphApiService.removeEdge(sourceId, targetId));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImportResultDto> importGraph(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("Graph imported.", graphApiService.importFromTxtFile(file));
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportGraph() {
        String content = graphApiService.exportToTxt();
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=city-graph.txt")
                .body(content);
    }
}
