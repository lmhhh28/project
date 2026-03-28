package com.citygraph.api.dto;

import java.util.List;

public record AlgorithmResultDto(String algorithm, List<String> logs, GraphDto graph) {
}
