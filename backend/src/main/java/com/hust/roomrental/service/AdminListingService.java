package com.hust.roomrental.service;

import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingResponse;
import org.springframework.data.domain.Pageable;

public interface AdminListingService {

    PageResponse<ListingResponse> listPending(Pageable pageable);

    void approve(Long listingId);

    void reject(Long listingId);
}
