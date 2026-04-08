package com.hust.roomrental.service.impl;

import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.ListingStatus;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingResponse;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.AdminListingService;
import com.hust.roomrental.service.ListingQuotaService;
import com.hust.roomrental.service.mapper.ListingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminListingServiceImpl implements AdminListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ListingQuotaService listingQuotaService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ListingResponse> listPending(Pageable pageable) {
        Page<Listing> page = listingRepository.findByStatus(ListingStatus.PENDING_REVIEW, pageable);
        return PageResponse.from(page.map(ListingMapper::toResponse));
    }

    @Override
    @Transactional
    public void approve(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Không tìm thấy tin"));
        if (listing.getStatus() != ListingStatus.PENDING_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATE", "Tin không ở trạng thái chờ duyệt");
        }
        User owner = userRepository.findById(listing.getOwner().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy user"));
        if (!listingQuotaService.canPublishOneMore(owner)) {
            throw new ApiException(HttpStatus.CONFLICT, "QUOTA_EXCEEDED", "Chủ trọ đã hết quota đăng tin trong tháng");
        }
        listing.setStatus(ListingStatus.PUBLISHED);
        listing.setPublishedAt(Instant.now());
    }

    @Override
    @Transactional
    public void reject(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Không tìm thấy tin"));
        if (listing.getStatus() != ListingStatus.PENDING_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATE", "Tin không ở trạng thái chờ duyệt");
        }
        listing.setStatus(ListingStatus.REJECTED);
    }
}
