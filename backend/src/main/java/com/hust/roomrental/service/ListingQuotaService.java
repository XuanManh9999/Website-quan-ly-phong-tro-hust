package com.hust.roomrental.service;

import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.domain.entity.PaymentOrder;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.repository.PaymentOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class ListingQuotaService {

    private final ListingRepository listingRepository;
    private final AppProperties appProperties;
    private final PaymentOrderRepository paymentOrderRepository;

    public boolean canPublishOneMore(User owner) {
        QuotaInfo q = getQuotaInfo(owner);
        return q.used < q.allowed;
    }

    public QuotaInfo getQuotaInfo(User owner) {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime startOfMonth = ZonedDateTime.now(zone).withDayOfMonth(1).toLocalDate().atStartOfDay(zone);
        ZonedDateTime startOfNextMonth = startOfMonth.plusMonths(1);
        Instant start = startOfMonth.toInstant();
        Instant end = startOfNextMonth.toInstant();
        long used = listingRepository.countPublishedInMonth(owner.getId(), start, end);
        int allowed = appProperties.getListing().getDefaultQuotaPerMonth() + bestExtraListingsInMonth(owner.getId(), start, end);
        return new QuotaInfo((int) used, allowed, Math.max(0, allowed - (int) used));
    }

    private int bestExtraListingsInMonth(Long userId, Instant start, Instant end) {
        try {
            return paymentOrderRepository.findTop50WithPackageByUserIdOrderByCreatedAtDesc(userId).stream()
                    .filter(o -> o.getStatus() == PaymentOrderStatus.PAID)
                    .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(start) && o.getCreatedAt().isBefore(end))
                    .map(PaymentOrder::getSubscriptionPackage)
                    .filter(p -> p != null)
                    .max(Comparator.comparing(p -> p.getPriceVnd(), Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(p -> Math.max(0, p.getExtraListingsPerMonth()))
                    .orElse(0);
        } catch (Exception ignored) {
            return 0;
        }
    }

    public record QuotaInfo(int used, int allowed, int remaining) {}
}
