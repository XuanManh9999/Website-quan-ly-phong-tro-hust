package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.payment.CreatePaymentRequest;
import com.hust.roomrental.dto.payment.CreatePaymentResponse;
import com.hust.roomrental.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payments/orders")
    public CreatePaymentResponse create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        return paymentService.createPayment(user, request.packageCode());
    }

    /**
     * IPN VNPay (sandbox/production gọi server-to-server). Cho phép không auth.
     */
    @GetMapping(value = "/payments/vnpay/ipn", produces = MediaType.TEXT_PLAIN_VALUE)
    public String ipnGet(@RequestParam Map<String, String> params) {
        return paymentService.handleIpn(params);
    }

    @PostMapping(value = "/payments/vnpay/ipn", produces = MediaType.TEXT_PLAIN_VALUE)
    public String ipnPost(@RequestParam Map<String, String> params) {
        return paymentService.handleIpn(params);
    }
}
