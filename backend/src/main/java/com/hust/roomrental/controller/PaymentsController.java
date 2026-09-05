package com.hust.roomrental.controller;

import com.hust.roomrental.config.AppProperties;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hust.roomrental.domain.entity.DiscountCoupon;
import com.hust.roomrental.domain.entity.PaymentOrder;
import com.hust.roomrental.domain.entity.SubscriptionPackage;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.DiscountCouponRepository;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.repository.PaymentOrderRepository;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.PaymentService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.hibernate.ObjectNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentsController {

    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final DiscountCouponRepository discountCouponRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final AppProperties appProperties;
    private final PaymentService paymentService;
    private final com.hust.roomrental.integration.vnpay.VnPaySignatureVerifier vnPaySignatureVerifier;

    @GetMapping("/packages/me")
    @Transactional(readOnly = true)
    public Map<String, Object> myPackage(@AuthenticationPrincipal User user) {
        ensureLandlordOrAdmin(user);
        LocalDate firstDay = LocalDate.now().withDayOfMonth(1);
        Instant from = firstDay.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = firstDay.plusMonths(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<PaymentOrder> history = paymentOrderRepository.findTop50WithPackageByUserIdOrderByCreatedAtDesc(user.getId());
        SubscriptionPackage best = history.stream()
                .filter(o -> o.getStatus() == PaymentOrderStatus.PAID)
                .map(this::safeGetPackage)
                .filter(Objects::nonNull)
                .max(Comparator.comparing(SubscriptionPackage::getPriceVnd, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        int defaultQuota = appProperties.getListing().getDefaultQuotaPerMonth();
        int currentQuota = defaultQuota + (best != null ? Math.max(0, best.getExtraListingsPerMonth()) : 0);
        long used = listingRepository.countPublishedInMonth(user.getId(), from, to);

        List<SubscriptionPackage> activePackages = subscriptionPackageRepository.findByActiveIsTrueOrderByPriceVndAsc();
        Map<String, Integer> rankByCode = new HashMap<>();
        for (int i = 0; i < activePackages.size(); i++) {
            rankByCode.put(activePackages.get(i).getCode(), i + 1);
        }

        Map<String, Object> current = new HashMap<>();
        current.put("code", best != null ? best.getCode() : "basic");
        current.put("quota", currentQuota);
        current.put("rank", best != null ? rankByCode.getOrDefault(best.getCode(), 1) : 1);
        current.put("name", best != null ? best.getName() : "Basic");
        current.put("price", best != null ? best.getPriceVnd() : BigDecimal.ZERO);

        List<Map<String, Object>> packages = activePackages.stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("code", p.getCode());
                    m.put("name", p.getName());
                    m.put("quota", defaultQuota + Math.max(0, p.getExtraListingsPerMonth()));
                    m.put("price", p.getPriceVnd());
                    m.put("rank", rankByCode.getOrDefault(p.getCode(), 1));
                    m.put("isActive", p.isActive());
                    m.put("desc", "Đăng tối đa " + (defaultQuota + Math.max(0, p.getExtraListingsPerMonth())) + " tin/tháng");
                    return m;
                })
                .toList();

        return Map.of(
                "current", current,
                "used", used,
                "remaining", Math.max(0, currentQuota - used),
                "packages", packages
        );
    }

    @GetMapping("/me/history")
    @Transactional(readOnly = true)
    public Map<String, Object> myHistory(@AuthenticationPrincipal User user) {
        ensureLandlordOrAdmin(user);
        List<Map<String, Object>> items = paymentOrderRepository.findTop50WithPackageByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(o -> {
                    Map<String, Object> m = new HashMap<>();
                    SubscriptionPackage pkg = safeGetPackage(o);
                    m.put("id", o.getId());
                    m.put("packageCode", pkg != null ? pkg.getCode() : null);
                    m.put("couponCode", o.getCouponCode());
                    m.put("amount", o.getAmountVnd());
                    m.put("originalAmount", o.getOriginalAmountVnd() != null ? o.getOriginalAmountVnd() : o.getAmountVnd());
                    m.put("discountAmount", o.getDiscountAmountVnd() != null ? o.getDiscountAmountVnd() : BigDecimal.ZERO);
                    m.put("status", o.getStatus() != null ? toCompatStatus(o.getStatus()) : "pending");
                    m.put("txnRef", o.getVnpTxnRef());
                    m.put("createdAt", o.getCreatedAt());
                    m.put("paidAt", o.getPaidAt());
                    return m;
                })
                .toList();
        return Map.of("items", items);
    }

    @PostMapping("/vnpay/preview-package")
    public Map<String, Object> previewPackagePayment(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PackagePaymentRequest request
    ) {
        ensureLandlordOrAdmin(user);
        SubscriptionPackage pkg = findActivePackage(request.packageCode());
        int basePrice = pkg.getPriceVnd().intValue();
        DiscountResult discount = computeDiscount(basePrice, request.coupon(), pkg.getCode());
        Map<String, Object> res = new HashMap<>();
        res.put("packageCode", pkg.getCode());
        res.put("basePrice", basePrice);
        res.put("discountAmount", discount.discountAmount());
        res.put("finalAmount", Math.max(0, basePrice - discount.discountAmount()));
        res.put("couponCode", discount.couponCode());
        res.put("couponError", discount.errorMessage());
        return res;
    }

    @PostMapping("/vnpay/create")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createPackagePayment(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreatePackagePaymentRequest request
    ) {
        ensureLandlordOrAdmin(user);
        SubscriptionPackage pkg = findActivePackage(request.packageCode());
        int basePrice = pkg.getPriceVnd().intValue();
        DiscountResult discount = computeDiscount(basePrice, request.coupon(), pkg.getCode());
        if (discount.errorMessage() != null && !discount.errorMessage().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COUPON", discount.errorMessage());
        }
        int finalAmount = Math.max(0, basePrice - discount.discountAmount());

        String txnRef = "PKG_" + pkg.getCode() + "_" + System.currentTimeMillis();
        PaymentOrder order = PaymentOrder.builder()
                .user(user)
                .subscriptionPackage(pkg)
                .amountVnd(BigDecimal.valueOf(finalAmount))
                .originalAmountVnd(BigDecimal.valueOf(basePrice))
                .discountAmountVnd(BigDecimal.valueOf(discount.discountAmount()))
                .couponCode(discount.couponCode())
                .status(PaymentOrderStatus.PENDING)
                .vnpTxnRef(txnRef)
                .build();
        order = paymentOrderRepository.save(order);

        if (finalAmount == 0) {
            markPaid(order, "FREE");
            return Map.of("paymentId", order.getId(), "free", true);
        }

        String returnUrl = request.returnUrl() != null && !request.returnUrl().isBlank()
                ? request.returnUrl()
                : appProperties.getVnpay().getReturnUrl();

        String vnpUrl;
        try {
            vnpUrl = vnPaySignatureVerifier.buildPaymentUrl(
                    txnRef,
                    finalAmount,
                    "Thanh toan goi " + pkg.getName(),
                    "127.0.0.1",
                    returnUrl
            );
        } catch (Exception e) {
            vnpUrl = returnUrl
                    + (returnUrl.contains("?") ? "&" : "?")
                    + "vnp_TxnRef=" + txnRef
                    + "&vnp_ResponseCode=00";
        }

        Map<String, Object> res = new HashMap<>();
        res.put("paymentId", order.getId());
        res.put("vnp_Url", vnpUrl);
        res.put("amount", finalAmount);
        res.put("discountAmount", discount.discountAmount());
        res.put("originalAmount", basePrice);
        return res;
    }

    @GetMapping("/vnpay/return")
    @Transactional
    public Map<String, Object> vnpayReturn(@RequestParam Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TXN", "Thiếu mã giao dịch");
        }
        PaymentOrder order = paymentOrderRepository.findByVnpTxnRef(txnRef)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Không tìm thấy giao dịch"));

        if (params.containsKey("vnp_SecureHash") && !paymentService.verifyReturnSignature(params)) {
            return Map.of(
                    "ok", false,
                    "paymentId", order.getId(),
                    "status", toCompatStatus(order.getStatus()),
                    "message", "Chữ ký giao dịch không hợp lệ"
            );
        }

        String code = params.get("vnp_ResponseCode");
        if (!"00".equals(code)) {
            order.setStatus(PaymentOrderStatus.FAILED);
            order.setRawIpnPayload(params.toString());
            return Map.of(
                    "ok", false,
                    "paymentId", order.getId(),
                    "status", toCompatStatus(order.getStatus()),
                    "message", "Thanh toán thất bại"
            );
        }

        markPaid(order, params.getOrDefault("vnp_TransactionNo", txnRef));
        order.setRawIpnPayload(params.toString());
        return Map.of(
                "ok", true,
                "paymentId", order.getId(),
                "status", toCompatStatus(order.getStatus()),
                "message", "Thanh toán thành công"
        );
    }

    /**
     * IPN VNPay (sandbox/production server-to-server). Không auth.
     */
    @GetMapping(value = "/vnpay/ipn", produces = MediaType.TEXT_PLAIN_VALUE)
    public String vnpayIpnGet(@RequestParam Map<String, String> params) {
        return paymentService.handleIpn(params);
    }

    @PostMapping(value = "/vnpay/ipn", produces = MediaType.TEXT_PLAIN_VALUE)
    public String vnpayIpnPost(@RequestParam Map<String, String> params) {
        return paymentService.handleIpn(params);
    }

    private DiscountResult computeDiscount(int basePrice, String rawCoupon, String packageCode) {
        if (rawCoupon == null || rawCoupon.isBlank()) return new DiscountResult(0, null, null);
        String code = rawCoupon.trim().toUpperCase(Locale.ROOT);
        DiscountCoupon c = discountCouponRepository.findByCodeIgnoreCase(code).orElse(null);
        if (c == null || !c.isActive()) return new DiscountResult(0, null, "Mã không tồn tại hoặc đã tắt.");
        LocalDate today = LocalDate.now();
        if (c.getValidFrom() != null && c.getValidFrom().isAfter(today)) return new DiscountResult(0, null, "Mã chưa đến thời gian áp dụng.");
        if (c.getValidUntil() != null && c.getValidUntil().isBefore(today)) return new DiscountResult(0, null, "Mã đã hết hạn.");
        if (!appliesToPackage(c, packageCode)) return new DiscountResult(0, null, "Mã này không áp dụng cho gói bạn chọn.");

        int discount;
        if ("fixed".equalsIgnoreCase(c.getDiscountType())) {
            discount = Math.max(0, c.getDiscountValue());
        } else {
            discount = (basePrice * Math.max(0, c.getDiscountValue())) / 100;
            if (c.getMaxDiscountVnd() != null && c.getMaxDiscountVnd() > 0) {
                discount = (int) Math.min(discount, c.getMaxDiscountVnd());
            }
        }
        discount = Math.min(discount, basePrice);
        return new DiscountResult(discount, c.getCode(), null);
    }

    private boolean appliesToPackage(DiscountCoupon coupon, String packageCode) {
        String raw = coupon.getApplicablePackageCodes();
        if (raw == null || raw.isBlank()) return true;
        String normalized = raw.toLowerCase(Locale.ROOT).replace("\"", "");
        return normalized.contains(packageCode.toLowerCase(Locale.ROOT));
    }

    private SubscriptionPackage findActivePackage(String packageCode) {
        return subscriptionPackageRepository.findByCodeAndActiveIsTrue(packageCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PACKAGE_NOT_FOUND", "Gói không tồn tại hoặc đã bị tắt"));
    }

    private void markPaid(PaymentOrder order, String vnpTxnNo) {
        if (order.getStatus() == PaymentOrderStatus.PAID) return;
        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaidAt(Instant.now());
        order.setVnpTransactionNo(vnpTxnNo);
        paymentOrderRepository.save(order);

        User u = userRepository.findById(order.getUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản"));
        int extra = order.getSubscriptionPackage().getExtraListingsPerMonth();
        u.setBonusListingSlots(u.getBonusListingSlots() + Math.max(0, extra));
        userRepository.save(u);
    }

    private SubscriptionPackage safeGetPackage(PaymentOrder order) {
        try {
            return order.getSubscriptionPackage();
        } catch (EntityNotFoundException | ObjectNotFoundException ex) {
            return null;
        }
    }

    private String toCompatStatus(PaymentOrderStatus status) {
        return switch (status) {
            case PAID -> "paid";
            case FAILED -> "failed";
            case PENDING -> "pending";
            case CANCELLED -> "failed";
        };
    }

    private void ensureLandlordOrAdmin(User user) {
        if (user == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        if (user.getRole() != UserRole.LANDLORD && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ chủ trọ mới thực hiện được");
        }
    }

    public record PackagePaymentRequest(
            @NotBlank(message = "Thiếu package") String packageCode,
            String coupon
    ) {
        @JsonCreator
        public PackagePaymentRequest(
                @JsonProperty("package") String packageCode,
                @JsonProperty("coupon") String coupon
        ) {
            this.packageCode = packageCode;
            this.coupon = coupon;
        }
    }

    public record CreatePackagePaymentRequest(
            @NotBlank(message = "Thiếu package") String packageCode,
            String coupon,
            String returnUrl
    ) {
        @JsonCreator
        public CreatePackagePaymentRequest(
                @JsonProperty("package") String packageCode,
                @JsonProperty("coupon") String coupon,
                @JsonProperty("returnUrl") String returnUrl
        ) {
            this.packageCode = packageCode;
            this.coupon = coupon;
            this.returnUrl = returnUrl;
        }
    }

    private record DiscountResult(int discountAmount, String couponCode, String errorMessage) {}
}
