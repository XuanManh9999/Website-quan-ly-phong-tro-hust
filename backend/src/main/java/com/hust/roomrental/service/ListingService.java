package com.hust.roomrental.service;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingResponse;
import com.hust.roomrental.dto.listing.ListingUpsertRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ListingService {

    PageResponse<ListingResponse> searchPublic(
            String district,
            String ward,
            String province,
            String q,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minArea,
            Double maxArea,
            String sort,
            Pageable pageable
    );

    ListingResponse getPublicById(Long id);

    PageResponse<ListingResponse> listMine(User landlord, Pageable pageable);

    ListingResponse create(User landlord, ListingUpsertRequest request);

    ListingResponse update(User landlord, Long id, ListingUpsertRequest request);

    void delete(User landlord, Long id);
}
