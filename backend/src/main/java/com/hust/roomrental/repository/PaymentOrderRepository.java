package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.PaymentOrder;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByVnpTxnRef(String vnpTxnRef);

    @Query("SELECT COALESCE(SUM(p.amountVnd), 0) FROM PaymentOrder p WHERE p.status = :st AND p.paidAt >= :from AND p.paidAt < :to")
    BigDecimal sumPaidAmountBetween(
            @Param("st") PaymentOrderStatus status,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    long countByStatusAndPaidAtBetween(PaymentOrderStatus status, Instant from, Instant to);
}
