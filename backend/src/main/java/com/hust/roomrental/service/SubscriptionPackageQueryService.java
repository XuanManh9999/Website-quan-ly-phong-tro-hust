package com.hust.roomrental.service;

import com.hust.roomrental.dto.subscription.SubscriptionPackageResponse;

import java.util.List;

public interface SubscriptionPackageQueryService {

    List<SubscriptionPackageResponse> listActive();
}
