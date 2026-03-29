package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.SubscriptionPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPackageRepository extends JpaRepository<SubscriptionPackage, Long> {

    Optional<SubscriptionPackage> findByCodeAndActiveIsTrue(String code);

    List<SubscriptionPackage> findByActiveIsTrueOrderByPriceVndAsc();
}
