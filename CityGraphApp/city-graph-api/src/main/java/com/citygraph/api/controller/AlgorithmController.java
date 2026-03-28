package com.citygraph.api.controller;

import com.citygraph.api.dto.AlgorithmResultDto;
import com.citygraph.api.dto.ApiResponse;
import com.citygraph.api.dto.request.ShortestPathRequest;
import com.citygraph.api.dto.request.TspRequest;
import com.citygraph.api.service.GraphApiService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/algorithms")
public class AlgorithmController {

    private final GraphApiService graphApiService;

    public AlgorithmController(GraphApiService graphApiService) {
        this.graphApiService = graphApiService;
    }

    @PostMapping("/connectivity-fix")
    public ApiResponse<AlgorithmResultDto> runConnectivityFix() {
        return ApiResponse.ok("Q5 executed.", graphApiService.runConnectivityFix());
    }

    @PostMapping("/shortest-path")
    public ApiResponse<AlgorithmResultDto> runShortestPath(@Valid @RequestBody ShortestPathRequest request) {
        return ApiResponse.ok("Q6 executed.", graphApiService.runShortestPath(request.sourceId()));
    }

    @PostMapping("/tsp")
    public ApiResponse<AlgorithmResultDto> runTsp(@Valid @RequestBody TspRequest request) {
        return ApiResponse.ok("Q7 executed.", graphApiService.runTsp(request.startCityId(), request.returnToStart()));
    }

    @PostMapping("/steiner-tree")
    public ApiResponse<AlgorithmResultDto> runSteinerTree() {
        return ApiResponse.ok("Q8 executed.", graphApiService.runSteinerTree());
    }
}
