package com.hust.roomrental.integration.vnpay;

import com.hust.roomrental.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Verify chữ ký HMAC SHA512 theo tài liệu VNPay.
 */
@Component
@RequiredArgsConstructor
public class VnPaySignatureVerifier {
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter PAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AppProperties appProperties;

    public boolean verifyIpn(Map<String, String> params) {
        String secret = appProperties.getVnpay().getHashSecret();
        if (secret == null || secret.isBlank()) {
            return true;
        }
        String provided = valueOf(params, "vnp_SecureHash");
        if (provided == null || provided.isBlank()) {
            return false;
        }
        String signData = buildSignData(params);
        String expected = hmacSha512(secret, signData);
        return expected.equalsIgnoreCase(provided.trim());
    }

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

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(Math.max(0L, amountVnd) * 100L));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", trimOrderInfo(orderInfo));
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", effectiveReturnUrl);
        params.put("vnp_IpAddr", normalizeIp(clientIp));
        params.put("vnp_CreateDate", LocalDateTime.now(VIETNAM).format(PAY_DATE));

        String signData = buildSignData(params);
        String secureHash = hmacSha512(secret, signData);
        String query = params.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(e -> e.getKey() + "=" + encode(e.getValue()))
                .collect(Collectors.joining("&"));
        return paymentUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Build querystring for signing:
     * - include only keys start with "vnp_"
     * - exclude vnp_SecureHash, vnp_SecureHashType
     * - sort by key ASC
     * - join as key=value with '&'
     */
    private String buildSignData(Map<String, String> params) {
        Map<String, String> filtered = params.entrySet().stream()
                .filter(e -> e.getKey() != null && e.getKey().startsWith("vnp_"))
                .filter(e -> !"vnp_SecureHash".equals(e.getKey()))
                .filter(e -> !"vnp_SecureHashType".equals(e.getKey()))
                .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        return filtered.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
    }

    private String valueOf(Map<String, String> params, String key) {
        return params.get(key);
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

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String hmacSha512(String secret, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(key);
            byte[] raw = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return toHex(raw);
        } catch (Exception e) {
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
