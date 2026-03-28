package com.citygraph.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record CreateEdgeRequest(
        @NotNull(message = "sourceId is required") Integer sourceId,
        @NotNull(message = "targetId is required") Integer targetId
) {
}
