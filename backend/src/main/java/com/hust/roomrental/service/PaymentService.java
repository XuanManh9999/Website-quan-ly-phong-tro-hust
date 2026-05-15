package com.hust.roomrental.service;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.payment.CreatePaymentResponse;

import java.util.Map;

public interface PaymentService {

    CreatePaymentResponse createPayment(User user, String packageCode);

    /** Xử lý IPN VNPay; trả mã phản hồi theo quy ước VNPay (ví dụ "00"). */
    String handleIpn(Map<String, String> params);

    /** Kiểm tra chữ ký callback/return từ VNPay. */
    boolean verifyReturnSignature(Map<String, String> params);
}
