package com.citygraph.api.dto;

public record GraphSummaryDto(int cityCount, int edgeCount, int realEdgeCount, int virtualEdgeCount, int steinerEdgeCount) {
}
