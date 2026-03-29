package com.hust.roomrental.integration.vnpay;

import com.hust.roomrental.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Stub / tối giản: production cần kiểm tra chữ ký HMAC SHA512 theo tài liệu VNPay.
 */
@Component
@RequiredArgsConstructor
public class VnPaySignatureVerifier {

    private final AppProperties appProperties;

    public boolean verifyIpn(Map<String, String> params) {
        String secret = appProperties.getVnpay().getHashSecret();
        if (secret == null || secret.isBlank()) {
            return true;
        }
        // TODO: sort fields, exclude vnp_SecureHash, build sign data, compare with vnp_SecureHash
        return true;
    }
}
