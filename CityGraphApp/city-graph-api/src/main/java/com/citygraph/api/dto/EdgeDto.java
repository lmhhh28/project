package com.citygraph.api.dto;

public record EdgeDto(int sourceId, int targetId, int length, boolean virtual, boolean highlighted, boolean steiner) {
}
