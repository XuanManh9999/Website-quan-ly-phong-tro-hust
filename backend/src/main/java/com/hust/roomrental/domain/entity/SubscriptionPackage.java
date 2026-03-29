package com.hust.roomrental.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_packages", indexes = @Index(columnList = "code", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_vnd", nullable = false, precision = 14, scale = 0)
    private BigDecimal priceVnd;

    @Column(name = "extra_listings_per_month", nullable = false)
    private int extraListingsPerMonth;

    @Column(name = "priority_days")
    private Integer priorityDays;

    @Column(nullable = false)
    private boolean active = true;
}
