package com.citygraph.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateCityRequest(
        @NotBlank(message = "name is required") String name,
        @NotNull(message = "x is required") Integer x,
        @NotNull(message = "y is required") Integer y,
        String description
) {
}
