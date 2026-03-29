package com.hust.roomrental.controller;

import com.hust.roomrental.dto.subscription.SubscriptionPackageResponse;
import com.hust.roomrental.service.SubscriptionPackageQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/packages")
@RequiredArgsConstructor
public class SubscriptionPackagePublicController {

    private final SubscriptionPackageQueryService subscriptionPackageQueryService;

    @GetMapping
    public List<SubscriptionPackageResponse> list() {
        return subscriptionPackageQueryService.listActive();
    }
}
