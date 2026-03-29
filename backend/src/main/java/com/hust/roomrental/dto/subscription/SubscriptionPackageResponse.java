package com.hust.roomrental.dto.subscription;

import java.math.BigDecimal;

public record SubscriptionPackageResponse(
        Long id,
        String code,
        String name,
        String description,
        BigDecimal priceVnd,
        int extraListingsPerMonth,
        Integer priorityDays
) {
}
