package com.citygraph.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record TspRequest(
        @NotNull(message = "startCityId is required") Integer startCityId,
        @NotNull(message = "returnToStart is required") Boolean returnToStart
) {
}
