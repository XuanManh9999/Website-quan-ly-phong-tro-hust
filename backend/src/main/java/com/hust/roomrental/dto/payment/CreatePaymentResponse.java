package com.hust.roomrental.dto.payment;

public record CreatePaymentResponse(
        Long orderId,
        String paymentUrl,
        String vnpTxnRef
) {
}
