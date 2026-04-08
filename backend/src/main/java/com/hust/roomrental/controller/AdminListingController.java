package com.hust.roomrental.controller;

import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingResponse;
import com.hust.roomrental.service.AdminListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/listings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminListingController {

    private final AdminListingService adminListingService;

    @GetMapping
    public PageResponse<ListingResponse> listPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return adminListingService.listPending(pageable);
    }

    @PostMapping("/{id}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable Long id) {
        adminListingService.approve(id);
    }

    @PostMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable Long id) {
        adminListingService.reject(id);
    }
}
