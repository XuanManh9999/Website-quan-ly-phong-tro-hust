package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingResponse;
import com.hust.roomrental.dto.listing.ListingUpsertRequest;
import com.hust.roomrental.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/landlord/listings")
@RequiredArgsConstructor
public class LandlordListingController {

    private final ListingService listingService;

    @GetMapping
    public PageResponse<ListingResponse> mine(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return listingService.listMine(user, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingResponse create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ListingUpsertRequest request
    ) {
        return listingService.create(user, request);
    }

    @PutMapping("/{id}")
    public ListingResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ListingUpsertRequest request
    ) {
        return listingService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        listingService.delete(user, id);
    }
}
