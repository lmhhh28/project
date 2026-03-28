package com.citygraph.api.dto;

import java.util.List;

public record ImportResultDto(List<String> warnings, GraphDto graph) {
}
