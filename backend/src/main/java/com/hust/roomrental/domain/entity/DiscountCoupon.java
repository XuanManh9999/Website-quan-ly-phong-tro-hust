package com.hust.roomrental.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "discount_coupons", indexes = {
        @Index(columnList = "code", unique = true),
        @Index(columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(name = "discount_type", nullable = false, length = 16)
    private String discountType; // percent | fixed

    @Column(name = "discount_value", nullable = false)
    private Integer discountValue;

    @Column(name = "max_discount_vnd")
    private Long maxDiscountVnd;

    @Column(name = "applicable_package_codes", columnDefinition = "TEXT")
    private String applicablePackageCodes; // JSON array string

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "per_user_limit", nullable = false)
    private Integer perUserLimit;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(length = 200)
    private String title;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
