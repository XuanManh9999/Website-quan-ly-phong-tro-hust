package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.DiscountCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscountCouponRepository extends JpaRepository<DiscountCoupon, Long> {

    Optional<DiscountCoupon> findByCodeIgnoreCase(String code);

    List<DiscountCoupon> findByIsActiveTrueOrderByIdDesc();
}
