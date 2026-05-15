package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.PaymentOrder;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByVnpTxnRef(String vnpTxnRef);

    List<PaymentOrder> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"subscriptionPackage"})
    List<PaymentOrder> findTop50WithPackageByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT p.createdAt, p.amountVnd, p.status FROM PaymentOrder p WHERE p.createdAt >= :from AND p.createdAt < :to")
    List<Object[]> findTimelineRowsBetween(@Param("from") Instant from, @Param("to") Instant to);

    long countByCouponCodeIgnoreCaseAndStatusIn(String couponCode, List<PaymentOrderStatus> statuses);

    long countByCouponCodeIgnoreCaseAndUserIdAndStatusIn(String couponCode, Long userId, List<PaymentOrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(p.amountVnd), 0) FROM PaymentOrder p WHERE p.status = :st AND p.paidAt >= :from AND p.paidAt < :to")
    BigDecimal sumPaidAmountBetween(
            @Param("st") PaymentOrderStatus status,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    long countByStatusAndPaidAtBetween(PaymentOrderStatus status, Instant from, Instant to);

    long countByStatus(PaymentOrderStatus status);

    @Query("SELECT COALESCE(SUM(p.amountVnd), 0) FROM PaymentOrder p WHERE p.status = :paid AND p.createdAt >= :from AND p.createdAt < :to")
    BigDecimal sumPaidAmountCreatedBetween(
            @Param("paid") PaymentOrderStatus paidStatus,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT sp.code, sp.name, COUNT(po.id), COALESCE(SUM(po.amountVnd), 0)
            FROM PaymentOrder po
            JOIN po.subscriptionPackage sp
            WHERE po.status = :paid
              AND po.createdAt >= :from
              AND po.createdAt < :to
            GROUP BY sp.code, sp.name, sp.id
            ORDER BY COALESCE(SUM(po.amountVnd), 0) DESC
            """)
    List<Object[]> summarizePaidPackageSalesBetween(
            @Param("paid") PaymentOrderStatus paidStatus,
            @Param("from") Instant from,
            @Param("to") Instant to
    );
}
