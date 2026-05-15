package com.hust.roomrental.dto.listing;

import com.hust.roomrental.domain.enums.ListingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ListingResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String ownerEmail,
        String ownerPhone,
        String title,
        String description,
        BigDecimal price,
        Double areaM2,
        String address,
        String district,
        Double latitude,
        Double longitude,
        Integer maxOccupants,
        String genderPolicy,
        BigDecimal deposit,
        String mapEmbedHtml,
        String utilitiesJson,
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
