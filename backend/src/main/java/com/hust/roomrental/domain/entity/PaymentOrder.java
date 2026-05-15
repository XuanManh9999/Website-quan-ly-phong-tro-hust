package com.hust.roomrental.domain.entity;

import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_orders", indexes = {
        @Index(columnList = "user_id"),
        @Index(columnList = "status"),
        @Index(columnList = "vnp_txn_ref", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private SubscriptionPackage subscriptionPackage;

    @Column(name = "amount_vnd", nullable = false, precision = 14, scale = 0)
    private BigDecimal amountVnd;

    @Column(name = "original_amount_vnd", precision = 14, scale = 0)
    private BigDecimal originalAmountVnd;

    @Column(name = "discount_amount_vnd", precision = 14, scale = 0)
    private BigDecimal discountAmountVnd;

    @Column(name = "coupon_code", length = 40)
    private String couponCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentOrderStatus status;

    @Column(name = "vnp_txn_ref", unique = true, length = 64)
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 64)
    private String vnpTransactionNo;

    @Column(name = "raw_ipn_payload", columnDefinition = "TEXT")
    private String rawIpnPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
