package com.hust.roomrental.service.mapper;

import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.entity.ListingImage;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.listing.ListingImageDto;
import com.hust.roomrental.dto.listing.ListingResponse;

import java.util.Comparator;
import java.util.Collections;
import java.util.List;

public final class ListingMapper {

    private ListingMapper() {
    }

    public static ListingResponse toResponse(Listing listing) {
        User owner = listing.getOwner();
        Long ownerId = owner != null ? owner.getId() : null;
        String ownerName = owner != null ? owner.getFullName() : null;
        String ownerEmail = owner != null ? owner.getEmail() : null;
        String ownerPhone = owner != null ? owner.getPhone() : null;

        List<ListingImage> listingImages = listing.getImages() != null ? listing.getImages() : Collections.emptyList();
        List<ListingImageDto> images = listingImages.stream()
                .sorted(Comparator.comparingInt(ListingImage::getSortOrder))
                .map(i -> new ListingImageDto(i.getId(), i.getUrl(), i.getSortOrder()))
                .toList();

        return new ListingResponse(
                listing.getId(),
                ownerId,
                ownerName,
                ownerEmail,
                ownerPhone,
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getAreaM2(),
                listing.getAddress(),
                listing.getDistrict(),
                listing.getLatitude(),
                listing.getLongitude(),
                listing.getMaxOccupants(),
                listing.getGenderPolicy(),
                listing.getDeposit(),
                listing.getMapEmbedHtml(),
                listing.getUtilitiesJson(),
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
