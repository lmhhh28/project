package com.citygraph.api.dto;

import java.util.List;

public record GraphDto(List<CityDto> cities, List<EdgeDto> edges, GraphSummaryDto summary) {
}
