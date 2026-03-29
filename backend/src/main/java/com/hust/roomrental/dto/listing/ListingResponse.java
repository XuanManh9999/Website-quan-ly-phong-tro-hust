package com.hust.roomrental.dto.listing;

import com.hust.roomrental.domain.enums.ListingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ListingResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String title,
        String description,
        BigDecimal price,
        Double areaM2,
        String address,
        String district,
        Double latitude,
        Double longitude,
        ListingStatus status,
        boolean roomAvailable,
        Instant expiresAt,
        Instant publishedAt,
        long viewCount,
        List<ListingImageDto> images,
        Instant createdAt,
        Instant updatedAt
) {
}
