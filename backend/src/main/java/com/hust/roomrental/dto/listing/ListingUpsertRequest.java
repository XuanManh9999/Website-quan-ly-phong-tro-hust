package com.hust.roomrental.dto.listing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ListingUpsertRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 20000) String description,
        @NotNull @Positive BigDecimal price,
        @Positive Double areaM2,
        @NotBlank @Size(max = 500) String address,
        @Size(max = 120) String district,
        Double latitude,
        Double longitude,
        boolean roomAvailable,
        List<ListingImageDto> images
) {
}
