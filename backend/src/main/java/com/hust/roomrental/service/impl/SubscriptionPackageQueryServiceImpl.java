package com.hust.roomrental.service.impl;

import com.hust.roomrental.dto.subscription.SubscriptionPackageResponse;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import com.hust.roomrental.service.SubscriptionPackageQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionPackageQueryServiceImpl implements SubscriptionPackageQueryService {

    private final SubscriptionPackageRepository subscriptionPackageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPackageResponse> listActive() {
        return subscriptionPackageRepository.findByActiveIsTrueOrderByPriceVndAsc().stream()
                .map(p -> new SubscriptionPackageResponse(
                        p.getId(),
                        p.getCode(),
                        p.getName(),
                        p.getDescription(),
                        p.getPriceVnd(),
                        p.getExtraListingsPerMonth(),
                        p.getPriorityDays()
                ))
                .toList();
    }
}
