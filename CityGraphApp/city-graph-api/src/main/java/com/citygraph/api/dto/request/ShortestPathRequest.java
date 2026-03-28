package com.citygraph.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record ShortestPathRequest(
        @NotNull(message = "sourceId is required") Integer sourceId
) {
}
