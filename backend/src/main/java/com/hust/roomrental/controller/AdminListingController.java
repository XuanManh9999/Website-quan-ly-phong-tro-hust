package com.hust.roomrental.controller;

import com.hust.roomrental.service.AdminListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/listings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminListingController {

    private final AdminListingService adminListingService;

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
