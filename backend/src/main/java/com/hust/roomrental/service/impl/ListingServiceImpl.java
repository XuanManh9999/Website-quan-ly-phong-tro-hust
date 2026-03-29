package com.hust.roomrental.service.impl;

import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.entity.ListingImage;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.ListingStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingImageDto;
import com.hust.roomrental.dto.listing.ListingResponse;
import com.hust.roomrental.dto.listing.ListingUpsertRequest;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.service.ListingService;
import com.hust.roomrental.service.mapper.ListingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingServiceImpl implements ListingService {

    private final ListingRepository listingRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ListingResponse> searchPublic(
            String district,
            String q,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Pageable pageable
    ) {
        Page<Listing> page = listingRepository.searchPublic(
                ListingStatus.PUBLISHED,
                emptyToNull(district),
                emptyToNull(q),
                minPrice,
                maxPrice,
                pageable
        );
        return PageResponse.from(page.map(ListingMapper::toResponse));
    }

    @Override
    @Transactional
    public ListingResponse getPublicById(Long id) {
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Không tìm thấy tin"));
        if (listing.getStatus() != ListingStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Không tìm thấy tin");
        }
        listing.setViewCount(listing.getViewCount() + 1);
        return ListingMapper.toResponse(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ListingResponse> listMine(User landlord, Pageable pageable) {
        assertLandlord(landlord);
        Page<Listing> page = listingRepository.findByOwnerId(landlord.getId(), pageable);
        return PageResponse.from(page.map(ListingMapper::toResponse));
    }

    @Override
    @Transactional
    public ListingResponse create(User landlord, ListingUpsertRequest request) {
        assertLandlord(landlord);
        Listing listing = Listing.builder()
                .owner(landlord)
                .title(request.title())
                .description(request.description())
                .price(request.price())
                .areaM2(request.areaM2())
                .address(request.address())
                .district(request.district())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .status(ListingStatus.PENDING_REVIEW)
                .roomAvailable(request.roomAvailable())
                .viewCount(0)
                .build();
        listing.setImages(mapImages(listing, request.images()));
        listing = listingRepository.save(listing);
        listing = listingRepository.findDetailById(listing.getId()).orElse(listing);
        return ListingMapper.toResponse(listing);
    }

    @Override
    @Transactional
    public ListingResponse update(User landlord, Long id, ListingUpsertRequest request) {
        assertLandlord(landlord);
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Không tìm thấy tin"));
        if (!listing.getOwner().getId().equals(landlord.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_OWNER", "Bạn không phải chủ tin");
        }
        if (listing.getStatus() == ListingStatus.PUBLISHED || listing.getStatus() == ListingStatus.EXPIRED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATE", "Không thể sửa tin đã hiển thị/hết hạn theo luồng MVP");
        }
        listing.setTitle(request.title());
        listing.setDescription(request.description());
        listing.setPrice(request.price());
        listing.setAreaM2(request.areaM2());
        listing.setAddress(request.address());
        listing.setDistrict(request.district());
        listing.setLatitude(request.latitude());
        listing.setLongitude(request.longitude());
        listing.setRoomAvailable(request.roomAvailable());
        listing.getImages().clear();
        listing.getImages().addAll(mapImages(listing, request.images()));
        listing.setStatus(ListingStatus.PENDING_REVIEW);
        listing = listingRepository.save(listing);
        listing = listingRepository.findDetailById(listing.getId()).orElse(listing);
        return ListingMapper.toResponse(listing);
    }

    @Override
    @Transactional
    public void delete(User landlord, Long id) {
        assertLandlord(landlord);
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND", "Không tìm thấy tin"));
        if (!listing.getOwner().getId().equals(landlord.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_OWNER", "Bạn không phải chủ tin");
        }
        listingRepository.delete(listing);
    }

    private void assertLandlord(User user) {
        if (user.getRole() != UserRole.LANDLORD && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_LANDLORD", "Chỉ chủ trọ mới thực hiện được");
        }
    }

    private List<ListingImage> mapImages(Listing listing, List<ListingImageDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return new ArrayList<>();
        }
        List<ListingImage> list = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            ListingImageDto d = dtos.get(i);
            int sort = d.sortOrder() != 0 ? d.sortOrder() : i;
            list.add(ListingImage.builder()
                    .listing(listing)
                    .url(d.url())
                    .sortOrder(sort)
                    .build());
        }
        return list;
    }

    private String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
