package com.hust.roomrental.dto.listing;

public record ListingImageDto(Long id, String url, int sortOrder) {
    public ListingImageDto(String url, int sortOrder) {
        this(null, url, sortOrder);
    }
}
