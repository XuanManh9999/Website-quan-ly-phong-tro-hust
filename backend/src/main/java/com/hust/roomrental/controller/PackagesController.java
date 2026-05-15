package com.hust.roomrental.controller;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.domain.entity.SubscriptionPackage;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/packages")
public class PackagesController {

    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final AppProperties appProperties;

    @GetMapping
    public Map<String, Object> listPublic() {
        var list = subscriptionPackageRepository.findByActiveIsTrueOrderByPriceVndAsc();
        java.util.concurrent.atomic.AtomicInteger rank = new java.util.concurrent.atomic.AtomicInteger(0);
        List<Map<String, Object>> packages = list.stream()
                .map(p -> toJsPackage(p, rank.incrementAndGet()))
                .toList();

        Map<String, Object> res = new HashMap<>();
        res.put("packages", packages);
        return res;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> listAdmin() {
        List<SubscriptionPackage> list = subscriptionPackageRepository.findAll().stream()
                .sorted(Comparator.comparing(SubscriptionPackage::getPriceVnd, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(SubscriptionPackage::getId))
                .toList();
        java.util.concurrent.atomic.AtomicInteger rank = new java.util.concurrent.atomic.AtomicInteger(0);
        List<Map<String, Object>> packages = list.stream()
                .map(p -> toJsPackage(p, rank.incrementAndGet()))
                .toList();

        Map<String, Object> res = new HashMap<>();
        res.put("packages", packages);
        return res;
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody UpsertPackageRequest request) {
        int baseQuota = baseQuotaPerMonth();
        SubscriptionPackage p = SubscriptionPackage.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .priceVnd(request.priceVnd())
                .extraListingsPerMonth(request.resolveExtraListingsPerMonth(baseQuota))
                .priorityDays(request.priorityDays())
                .active(request.active() == null || request.active())
                .build();

        SubscriptionPackage saved = subscriptionPackageRepository.save(p);
        Map<String, Object> res = new HashMap<>();
        res.put("package", toJsPackage(saved, 1));
        return res;
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody UpsertPackageRequest request) {
        int baseQuota = baseQuotaPerMonth();
        SubscriptionPackage p = subscriptionPackageRepository.findById(id).orElseThrow();
        p.setCode(request.code());
        p.setName(request.name());
        p.setDescription(request.description());
        p.setPriceVnd(request.priceVnd());
        p.setExtraListingsPerMonth(request.resolveExtraListingsPerMonth(baseQuota));
        p.setPriorityDays(request.priorityDays());
        if (request.active() != null) p.setActive(request.active());

        SubscriptionPackage saved = subscriptionPackageRepository.save(p);
        Map<String, Object> res = new HashMap<>();
        res.put("package", toJsPackage(saved, 1));
        return res;
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> remove(@PathVariable Long id) {
        subscriptionPackageRepository.deleteById(id);
        return Map.of("ok", true);
    }

    private Map<String, Object> toJsPackage(SubscriptionPackage p, int packageRank) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("code", p.getCode());
        m.put("name", p.getName());
        m.put("description", p.getDescription());
        // Keep both shapes: old NodeJS fields + new internal fields
        m.put("price", p.getPriceVnd());
        m.put("priceVnd", p.getPriceVnd());
        m.put("is_active", p.isActive());
        m.put("active", p.isActive());

        // Front-end admin packages page expects these legacy names.
        // We map "quota_posts_per_month" to a derived quota: base 5 + extra listings.
        int baseQuota = baseQuotaPerMonth();
        int quota = baseQuota + Math.max(0, p.getExtraListingsPerMonth());
        m.put("quota_posts_per_month", quota);

        // Front-end expects "package_rank" for sorting; we assign rank by price order.
        m.put("package_rank", packageRank);

        m.put("extraListingsPerMonth", p.getExtraListingsPerMonth());
        m.put("priorityDays", p.getPriorityDays());
        return m;
    }

    private int baseQuotaPerMonth() {
        return Math.max(0, appProperties.getListing().getDefaultQuotaPerMonth());
    }

    public record UpsertPackageRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description,
            @NotNull @Min(0) BigDecimal priceVnd,
            Integer extraListingsPerMonth,
            Integer quotaPostsPerMonth,
            Integer priorityDays,
            Boolean active
    ) {
        @JsonCreator
        public UpsertPackageRequest(
                @JsonProperty("code") String code,
                @JsonProperty("name") String name,
                @JsonProperty("description") String description,
                @JsonProperty("priceVnd") BigDecimal priceVnd,
                @JsonProperty("price") BigDecimal price,
                @JsonProperty("extraListingsPerMonth") Integer extraListingsPerMonth,
                @JsonProperty("quotaPostsPerMonth") Integer quotaPostsPerMonth,
                @JsonProperty("priorityDays") Integer priorityDays,
                @JsonProperty("active") Boolean active,
                @JsonProperty("isActive") Boolean isActive
        ) {
            this(
                    code,
                    name,
                    description,
                    priceVnd != null ? priceVnd : (price != null ? price : BigDecimal.ZERO),
                    extraListingsPerMonth,
                    quotaPostsPerMonth,
                    priorityDays,
                    active != null ? active : isActive
            );
        }

        public int resolveExtraListingsPerMonth(int baseQuotaPerMonth) {
            if (extraListingsPerMonth != null) return Math.max(0, extraListingsPerMonth);
            if (quotaPostsPerMonth == null) return 0;
            return Math.max(0, quotaPostsPerMonth - Math.max(0, baseQuotaPerMonth));
        }
    }
}
