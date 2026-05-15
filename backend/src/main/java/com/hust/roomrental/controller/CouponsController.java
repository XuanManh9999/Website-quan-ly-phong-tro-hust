package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.DiscountCoupon;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.DiscountCouponRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/coupons")
public class CouponsController {

    private final DiscountCouponRepository discountCouponRepository;
    private final com.hust.roomrental.repository.PaymentOrderRepository paymentOrderRepository;

    @GetMapping("/promotions")
    public Map<String, Object> landlordPromotions(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        if (user.getRole() != UserRole.LANDLORD) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ chủ trọ xem được khuyến mãi");
        }
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> promotions = discountCouponRepository.findByIsActiveTrueOrderByIdDesc().stream()
                .filter(c -> c.getValidFrom() == null || !c.getValidFrom().isAfter(today))
                .filter(c -> c.getValidUntil() == null || !c.getValidUntil().isBefore(today))
                .map(c -> toPromotion(c, user.getId()))
                .toList();
        return Map.of("promotions", promotions);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminList() {
        List<Map<String, Object>> coupons = discountCouponRepository.findAll().stream()
                .sorted(Comparator.comparing(DiscountCoupon::getId).reversed())
                .map(this::toAdminCoupon)
                .toList();
        return Map.of("coupons", coupons);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> adminCreate(@Valid @RequestBody UpsertCouponRequest request) {
        String code = normalizeCode(request.code());
        if (discountCouponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "COUPON_EXISTS", "Mã giảm giá đã tồn tại");
        }
        DiscountCoupon c = applyRequest(DiscountCoupon.builder().build(), request, code);
        c = discountCouponRepository.save(c);
        return Map.of("coupon", toAdminCoupon(c));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminUpdate(@PathVariable Long id, @Valid @RequestBody UpsertCouponRequest request) {
        DiscountCoupon existing = discountCouponRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COUPON_NOT_FOUND", "Không tìm thấy mã"));
        String code = normalizeCode(request.code());
        discountCouponRepository.findByCodeIgnoreCase(code).ifPresent(c -> {
            if (!Objects.equals(c.getId(), id)) {
                throw new ApiException(HttpStatus.CONFLICT, "COUPON_EXISTS", "Mã giảm giá đã tồn tại");
            }
        });
        DiscountCoupon updated = applyRequest(existing, request, code);
        updated = discountCouponRepository.save(updated);
        return Map.of("coupon", toAdminCoupon(updated));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminRemove(@PathVariable Long id) {
        if (!discountCouponRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "COUPON_NOT_FOUND", "Không tìm thấy mã");
        }
        discountCouponRepository.deleteById(id);
        return Map.of("ok", true);
    }

    private DiscountCoupon applyRequest(DiscountCoupon c, UpsertCouponRequest r, String code) {
        int discountValue = r.discountValue() == null ? 0 : r.discountValue();
        if ("percent".equalsIgnoreCase(r.discountType()) && discountValue > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT", "Giảm theo % tối đa 100");
        }
        c.setCode(code);
        c.setDiscountType("fixed".equalsIgnoreCase(r.discountType()) ? "fixed" : "percent");
        c.setDiscountValue(Math.max(0, discountValue));
        c.setMaxDiscountVnd(r.maxDiscountVnd());
        c.setApplicablePackageCodes(toApplicablePackagesJson(r.applicablePackageCodes()));
        c.setMaxUses(r.maxUses());
        c.setPerUserLimit(r.perUserLimit() == null ? 1 : Math.max(1, r.perUserLimit()));
        c.setValidFrom(parseDateSafe(r.validFrom()));
        c.setValidUntil(parseDateSafe(r.validUntil()));
        c.setActive(Boolean.TRUE.equals(r.isActive()));
        c.setTitle(r.title());
        return c;
    }

    private String toApplicablePackagesJson(List<String> codes) {
        if (codes == null || codes.isEmpty()) return null;
        List<String> normalized = codes.stream()
                .filter(Objects::nonNull)
                .map(s -> s.trim().toLowerCase(Locale.ROOT))
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
        if (normalized.isEmpty()) return null;
        return "[\"" + String.join("\",\"", normalized) + "\"]";
    }

    private LocalDate parseDateSafe(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value);
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private List<String> parseApplicablePackageCodes(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        String cleaned = raw.trim();
        if (!cleaned.startsWith("[") || !cleaned.endsWith("]")) return List.of();
        cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        if (cleaned.isBlank()) return List.of();
        String[] parts = cleaned.split(",");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            String x = p.trim().replace("\"", "").toLowerCase(Locale.ROOT);
            if (!x.isBlank()) out.add(x);
        }
        return out;
    }

    private String buildDiscountSummary(DiscountCoupon c) {
        if ("fixed".equalsIgnoreCase(c.getDiscountType())) {
            return "Giảm " + c.getDiscountValue().toString() + "đ";
        }
        if (c.getMaxDiscountVnd() != null && c.getMaxDiscountVnd() > 0) {
            return "Giảm " + c.getDiscountValue() + "% (tối đa " + c.getMaxDiscountVnd() + "đ)";
        }
        return "Giảm " + c.getDiscountValue() + "%";
    }

    private Map<String, Object> toPromotion(DiscountCoupon c, Long userId) {
        List<String> applicable = parseApplicablePackageCodes(c.getApplicablePackageCodes());
        var activeStatuses = java.util.List.of(
                com.hust.roomrental.domain.enums.PaymentOrderStatus.PENDING,
                com.hust.roomrental.domain.enums.PaymentOrderStatus.PAID
        );
        long activeUses = paymentOrderRepository.countByCouponCodeIgnoreCaseAndStatusIn(c.getCode(), activeStatuses);
        long userUses = paymentOrderRepository.countByCouponCodeIgnoreCaseAndUserIdAndStatusIn(c.getCode(), userId, activeStatuses);
        Integer maxUses = c.getMaxUses();
        int perUserLimit = c.getPerUserLimit() == null ? 1 : Math.max(1, c.getPerUserLimit());
        boolean globalOk = maxUses == null || maxUses <= 0 || activeUses < maxUses;
        boolean userOk = userUses < perUserLimit;

        Map<String, Object> m = new HashMap<>();
        m.put("code", c.getCode());
        m.put("title", c.getTitle());
        m.put("discountType", c.getDiscountType());
        m.put("discountValue", c.getDiscountValue());
        m.put("maxDiscountVnd", c.getMaxDiscountVnd());
        m.put("discountSummary", buildDiscountSummary(c));
        m.put("applicablePackageCodes", applicable.isEmpty() ? null : applicable);
        m.put("validFrom", c.getValidFrom() != null ? c.getValidFrom().toString() : null);
        m.put("validUntil", c.getValidUntil() != null ? c.getValidUntil().toString() : null);
        m.put("perUserLimit", c.getPerUserLimit());
        m.put("maxUses", c.getMaxUses());
        m.put("activeUses", activeUses);
        m.put("userUses", userUses);
        m.put("globallyAvailable", globalOk);
        m.put("youCanUse", globalOk && userOk);
        return m;
    }

    private Map<String, Object> toAdminCoupon(DiscountCoupon c) {
        var activeStatuses = java.util.List.of(
                com.hust.roomrental.domain.enums.PaymentOrderStatus.PENDING,
                com.hust.roomrental.domain.enums.PaymentOrderStatus.PAID
        );
        var paidStatuses = java.util.List.of(com.hust.roomrental.domain.enums.PaymentOrderStatus.PAID);
        long activeUses = paymentOrderRepository.countByCouponCodeIgnoreCaseAndStatusIn(c.getCode(), activeStatuses);
        long paidUses = paymentOrderRepository.countByCouponCodeIgnoreCaseAndStatusIn(c.getCode(), paidStatuses);

        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("code", c.getCode());
        m.put("discount_type", c.getDiscountType());
        m.put("discount_value", c.getDiscountValue());
        m.put("max_discount_vnd", c.getMaxDiscountVnd());
        m.put("applicable_package_codes", c.getApplicablePackageCodes());
        m.put("max_uses", c.getMaxUses());
        m.put("per_user_limit", c.getPerUserLimit());
        m.put("valid_from", c.getValidFrom() != null ? c.getValidFrom().toString() : null);
        m.put("valid_until", c.getValidUntil() != null ? c.getValidUntil().toString() : null);
        m.put("is_active", c.isActive());
        m.put("title", c.getTitle());
        m.put("paid_uses", paidUses);
        m.put("active_uses", activeUses);
        return m;
    }

    public record UpsertCouponRequest(
            @NotBlank String code,
            @NotBlank String discountType,
            Integer discountValue,
            Long maxDiscountVnd,
            List<String> applicablePackageCodes,
            Integer maxUses,
            Integer perUserLimit,
            String validFrom,
            String validUntil,
            Boolean isActive,
            String title
    ) {}
}
