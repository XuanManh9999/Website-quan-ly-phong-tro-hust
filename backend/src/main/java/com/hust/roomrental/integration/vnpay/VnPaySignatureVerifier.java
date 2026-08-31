package com.hust.roomrental.integration.vnpay;

import com.hust.roomrental.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Triển khai chuẩn thuật toán tạo URL và xác thực chữ ký VNPay 2.1.0 (HMAC-SHA512).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VnPaySignatureVerifier {
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter PAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AppProperties appProperties;

    public String buildPaymentUrl(
            String txnRef,
            long amountVnd,
            String orderInfo,
            String clientIp,
            String returnUrl
    ) {
        String secret = appProperties.getVnpay().getHashSecret();
        String tmnCode = appProperties.getVnpay().getTmnCode();
        String paymentUrl = appProperties.getVnpay().getPaymentUrl();
        if (isBlank(secret) || isBlank(tmnCode) || isBlank(paymentUrl)) {
            throw new IllegalStateException("VNPay chưa cấu hình đủ tmn-code/hash-secret/payment-url");
        }

        String effectiveReturnUrl = !isBlank(returnUrl) ? returnUrl : appProperties.getVnpay().getReturnUrl();
        if (isBlank(effectiveReturnUrl)) {
            throw new IllegalStateException("VNPay chưa cấu hình return-url");
        }

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", tmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(Math.max(0L, amountVnd) * 100L));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", trimOrderInfo(orderInfo));
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", effectiveReturnUrl);
        vnp_Params.put("vnp_IpAddr", normalizeIp(clientIp));
        vnp_Params.put("vnp_CreateDate", LocalDateTime.now(VIETNAM).format(PAY_DATE));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = hmacSha512(secret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        return paymentUrl + "?" + queryUrl;
    }

    public boolean verifyIpn(Map<String, String> fields) {
        String secret = appProperties.getVnpay().getHashSecret();
        if (secret == null || secret.isBlank()) {
            return true;
        }
        String vnp_SecureHash = fields.get("vnp_SecureHash");
        if (vnp_SecureHash == null || vnp_SecureHash.isBlank()) {
            return false;
        }

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()
                    && !fieldName.equals("vnp_SecureHash")
                    && !fieldName.equals("vnp_SecureHashType")
                    && fieldName.startsWith("vnp_")) {
                if (hashData.length() > 0) {
                    hashData.append('&');
                }
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
            }
        }
        String expectedHash = hmacSha512(secret, hashData.toString());
        if (expectedHash.equalsIgnoreCase(vnp_SecureHash.trim())) {
            return true;
        }

        // Fallback UTF-8
        StringBuilder hashDataUtf8 = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()
                    && !fieldName.equals("vnp_SecureHash")
                    && !fieldName.equals("vnp_SecureHashType")
                    && fieldName.startsWith("vnp_")) {
                if (hashDataUtf8.length() > 0) {
                    hashDataUtf8.append('&');
                }
                hashDataUtf8.append(fieldName);
                hashDataUtf8.append('=');
                hashDataUtf8.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
            }
        }
        return hmacSha512(secret, hashDataUtf8.toString()).equalsIgnoreCase(vnp_SecureHash.trim());
    }

    private String trimOrderInfo(String orderInfo) {
        String value = orderInfo == null || orderInfo.isBlank() ? "Thanh toan don hang" : orderInfo.trim();
        return value.length() > 240 ? value.substring(0, 240) : value;
    }

    private String normalizeIp(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "127.0.0.1";
        String ip = rawIp.split(",")[0].trim();
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) return "127.0.0.1";
        return ip;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String hmacSha512(String secret, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(key);
            byte[] raw = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return toHex(raw);
        } catch (Exception e) {
            log.error("Failed to compute HMAC SHA512", e);
            return "";
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
