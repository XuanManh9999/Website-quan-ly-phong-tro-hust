package com.hust.roomrental.service.mapper;

import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.entity.ListingImage;
import com.hust.roomrental.dto.listing.ListingImageDto;
import com.hust.roomrental.dto.listing.ListingResponse;

import java.util.Comparator;
import java.util.List;

public final class ListingMapper {

    private ListingMapper() {
    }

    public static ListingResponse toResponse(Listing listing) {
        List<ListingImageDto> images = listing.getImages().stream()
                .sorted(Comparator.comparingInt(ListingImage::getSortOrder))
                .map(i -> new ListingImageDto(i.getUrl(), i.getSortOrder()))
                .toList();
        var owner = listing.getOwner();
        return new ListingResponse(
                listing.getId(),
                owner.getId(),
                owner.getFullName(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getAreaM2(),
                listing.getAddress(),
                listing.getDistrict(),
                listing.getLatitude(),
                listing.getLongitude(),
                listing.getStatus(),
                listing.isRoomAvailable(),
                listing.getExpiresAt(),
                listing.getPublishedAt(),
                listing.getViewCount(),
                images,
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );
    }
}
