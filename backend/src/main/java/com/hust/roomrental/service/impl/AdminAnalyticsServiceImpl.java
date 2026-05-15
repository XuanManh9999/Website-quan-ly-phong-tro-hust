package com.hust.roomrental.service.impl;

import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.ListingStatus;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.domain.entity.SubscriptionPackage;
import com.hust.roomrental.repository.ArticleRepository;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.repository.PaymentOrderRepository;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.AdminAnalyticsService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter YMD = DateTimeFormatter.ISO_LOCAL_DATE;

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ArticleRepository articleRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final Environment environment;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> overview() {
        Instant monthStart = Instant.now().minus(30, ChronoUnit.DAYS);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("usersSeeker", userRepository.countByRole(UserRole.SEEKER));
        map.put("usersLandlord", userRepository.countByRole(UserRole.LANDLORD));
        map.put("listingsPublished", listingRepository.countByStatus(ListingStatus.PUBLISHED));
        map.put("listingsPending", listingRepository.countByStatus(ListingStatus.PENDING_REVIEW));
        map.put("articlesPublished", articleRepository.countActiveByStatus(ArticleStatus.PUBLISHED));
        BigDecimal revenue = paymentOrderRepository.sumPaidAmountBetween(
                PaymentOrderStatus.PAID, monthStart, Instant.now());
        map.put("revenueLast30DaysVnd", revenue != null ? revenue : BigDecimal.ZERO);
        map.put("generatedAt", Instant.now().toString());
        return map;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> dashboardSummary(LocalDate from, LocalDate to) {
        LocalDate normalizedFrom = from;
        LocalDate normalizedTo = to;
        Instant fromTs = normalizedFrom.atStartOfDay(VIETNAM).toInstant();
        Instant toExclusive = normalizedTo.plusDays(1).atStartOfDay(VIETNAM).toInstant();
        Timestamp fromSql = Timestamp.from(fromTs);
        Timestamp toSql = Timestamp.from(toExclusive);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("range", Map.of(
                "from", normalizedFrom.format(YMD),
                "to", normalizedTo.format(YMD)
        ));

        res.put("users", userRepository.count());
        res.put("rooms", listingRepository.count());
        res.put("posts", articleRepository.countActiveArticles());
        res.put("pendingRooms", listingRepository.countByStatus(ListingStatus.PENDING_REVIEW));
        res.put("publishedPosts", articleRepository.countActiveByStatus(ArticleStatus.PUBLISHED));
        res.put("paidPayments", paymentOrderRepository.countByStatus(PaymentOrderStatus.PAID));

        BigDecimal revenueInRange = paymentOrderRepository.sumPaidAmountCreatedBetween(
                PaymentOrderStatus.PAID, fromTs, toExclusive);
        long revenueLong = (revenueInRange != null ? revenueInRange : BigDecimal.ZERO)
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
        res.put("revenueInRange", revenueLong);

        res.put("roomsByStatus", toListingStatusBuckets());
        res.put("postsByStatus", toArticleStatusBuckets());

        Map<String, Integer> rankByPackage = packageRankByCodeAscPrice();
        if (usePostgresNativeDashboard()) {
            res.put("usersInRange", usersPerDay(fromSql, toSql));
            res.put("paymentsInRangeByDay", paymentsPerDay(fromSql, toSql));
            res.put("roomsInRangeByDay", listingsPerDay(fromSql, toSql));
            res.put("packageSalesInRange", packageSales(fromSql, toSql, rankByPackage));
            res.put("topLandlordsInRange", topLandlords(fromSql, toSql));
        } else {
            // H2 và DB khác: dựng chuỗi theo ngày từ timeline JPQL để không rỗng dashboard.
            res.put("usersInRange", usersPerDayPortable(fromTs, toExclusive));
            res.put("paymentsInRangeByDay", paymentsPerDayPortable(fromTs, toExclusive));
            res.put("roomsInRangeByDay", listingsPerDayPortable(fromTs, toExclusive));
            res.put("packageSalesInRange", packageSalesPortable(fromTs, toExclusive, rankByPackage));
            res.put("topLandlordsInRange", topLandlordsPortable(fromTs, toExclusive));
        }

        return res;
    }

    private boolean usePostgresNativeDashboard() {
        String url = environment.getProperty("spring.datasource.url", "");
        return url.toLowerCase(Locale.ROOT).contains("postgresql");
    }

    private Map<String, Integer> packageRankByCodeAscPrice() {
        List<SubscriptionPackage> list = subscriptionPackageRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        SubscriptionPackage::getPriceVnd,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();
        Map<String, Integer> map = new LinkedHashMap<>();
        int r = 0;
        for (SubscriptionPackage p : list) {
            map.put(p.getCode().toLowerCase(Locale.ROOT), ++r);
        }
        return map;
    }

    /** Bán gói (JPQL, chạy được trên H2). */
    private List<Map<String, Object>> packageSalesPortable(
            Instant from,
            Instant to,
            Map<String, Integer> rankByCode
    ) {
        List<Object[]> rows = paymentOrderRepository.summarizePaidPackageSalesBetween(
                PaymentOrderStatus.PAID,
                from,
                to
        );
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            String code = row[0].toString();
            BigDecimal revenue;
            if (row[3] instanceof BigDecimal bd) {
                revenue = bd;
            } else if (row[3] instanceof Number n) {
                revenue = BigDecimal.valueOf(n.doubleValue());
            } else if (row[3] != null) {
                revenue = new BigDecimal(row[3].toString());
            } else {
                revenue = BigDecimal.ZERO;
            }
            long cnt = toLongNumber(row[2]);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", code);
            m.put("name", row[1]);
            m.put("cnt", cnt);
            m.put("revenue", revenue.longValue());
            m.put("package_rank", rankByCode.getOrDefault(code.toLowerCase(Locale.ROOT), 0));
            out.add(m);
        }
        return out;
    }

    /** Top chủ trọ JPQL + sort trong JVM. */
    private List<Map<String, Object>> topLandlordsPortable(Instant from, Instant to) {
        Collection<ListingStatus> active = List.of(ListingStatus.PENDING_REVIEW, ListingStatus.PUBLISHED);
        List<Object[]> rows = new ArrayList<>(
                listingRepository.landlordRoomStatsBetween(from, to, active)
        );
        rows.sort(
                Comparator
                        .<Object[]>comparingLong((r) -> toLongNumber(r[4])).reversed()
                        .thenComparingLong((r) -> toLongNumber(r[3])).reversed()
        );

        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < Math.min(10, rows.size()); i++) {
            Object[] row = rows.get(i);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", toLongNumber(row[0]));
            m.put("email", row[1]);
            m.put("full_name", row[2]);
            m.put("rooms_created", toLongNumber(row[3]));
            m.put("rooms_submitted", toLongNumber(row[4]));
            out.add(m);
        }
        return out;
    }

    private static long toLongNumber(Object v) {
        if (v == null) return 0L;
        if (v instanceof Number n) return n.longValue();
        return Long.parseLong(v.toString());
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(v.toString());
    }

    private List<Map<String, Object>> usersPerDayPortable(Instant from, Instant to) {
        List<Instant> created = userRepository.findCreatedAtBetween(from, to);
        Map<LocalDate, Long> grouped = new LinkedHashMap<>();
        for (Instant at : created) {
            LocalDate day = at.atZone(VIETNAM).toLocalDate();
            grouped.put(day, grouped.getOrDefault(day, 0L) + 1L);
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<LocalDate, Long> e : grouped.entrySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", e.getKey().format(YMD));
            m.put("cnt", e.getValue());
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> paymentsPerDayPortable(Instant from, Instant to) {
        List<Object[]> rows = paymentOrderRepository.findTimelineRowsBetween(from, to);
        Map<LocalDate, long[]> grouped = new LinkedHashMap<>(); // [revenue, paidCnt]
        for (Object[] r : rows) {
            Instant createdAt = (Instant) r[0];
            BigDecimal amount = r[1] instanceof BigDecimal b ? b : BigDecimal.ZERO;
            PaymentOrderStatus status = (PaymentOrderStatus) r[2];
            LocalDate day = createdAt.atZone(VIETNAM).toLocalDate();
            long[] acc = grouped.computeIfAbsent(day, k -> new long[]{0L, 0L});
            if (status == PaymentOrderStatus.PAID) {
                acc[0] += amount.longValue();
                acc[1] += 1L;
            }
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<LocalDate, long[]> e : grouped.entrySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", e.getKey().format(YMD));
            m.put("revenue", e.getValue()[0]);
            m.put("paid_cnt", e.getValue()[1]);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> listingsPerDayPortable(Instant from, Instant to) {
        List<Object[]> rows = listingRepository.findTimelineRowsBetween(from, to);
        Map<LocalDate, long[]> grouped = new LinkedHashMap<>(); // [created, submitted]
        for (Object[] r : rows) {
            Instant createdAt = (Instant) r[0];
            ListingStatus st = (ListingStatus) r[1];
            LocalDate day = createdAt.atZone(VIETNAM).toLocalDate();
            long[] acc = grouped.computeIfAbsent(day, k -> new long[]{0L, 0L});
            acc[0] += 1L;
            if (st == ListingStatus.PENDING_REVIEW || st == ListingStatus.PUBLISHED) {
                acc[1] += 1L;
            }
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<LocalDate, long[]> e : grouped.entrySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", e.getKey().format(YMD));
            m.put("created_cnt", e.getValue()[0]);
            m.put("submitted_cnt", e.getValue()[1]);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> usersPerDay(Timestamp from, Timestamp to) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT TO_CHAR(CAST(timezone('Asia/Ho_Chi_Minh', u.created_at) AS date), 'YYYY-MM-DD') AS d,
                               CAST(COUNT(*) AS bigint) AS cnt
                        FROM app_users u
                        WHERE u.created_at >= :from AND u.created_at < :to
                        GROUP BY CAST(timezone('Asia/Ho_Chi_Minh', u.created_at) AS date)
                        ORDER BY CAST(timezone('Asia/Ho_Chi_Minh', u.created_at) AS date)
                        """)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
        return toDailyCntRows(rows);
    }

    private List<Map<String, Object>> paymentsPerDay(Timestamp from, Timestamp to) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT TO_CHAR(CAST(timezone('Asia/Ho_Chi_Minh', po.created_at) AS date), 'YYYY-MM-DD') AS d,
                               CAST(SUM(CASE WHEN po.status = 'PAID' THEN COALESCE(po.amount_vnd, 0) ELSE 0 END) AS numeric) AS revenue,
                               CAST(SUM(CASE WHEN po.status = 'PAID' THEN 1 ELSE 0 END) AS bigint) AS paid_cnt
                        FROM payment_orders po
                        WHERE po.created_at >= :from AND po.created_at < :to
                        GROUP BY CAST(timezone('Asia/Ho_Chi_Minh', po.created_at) AS date)
                        ORDER BY CAST(timezone('Asia/Ho_Chi_Minh', po.created_at) AS date)
                        """)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            BigDecimal revenue = toBigDecimal(row[1]);
            Number paidCnt = (row[2] instanceof Number n) ? n : null;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", row[0].toString());
            m.put("revenue", revenue.longValue());
            m.put("paid_cnt", paidCnt != null ? paidCnt.longValue() : 0L);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> listingsPerDay(Timestamp from, Timestamp to) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT TO_CHAR(CAST(timezone('Asia/Ho_Chi_Minh', l.created_at) AS date), 'YYYY-MM-DD') AS d,
                               CAST(COUNT(*) AS bigint) AS created_cnt,
                               CAST(SUM(CASE WHEN l.status IN ('PENDING_REVIEW', 'PUBLISHED') THEN 1 ELSE 0 END) AS bigint) AS submitted_cnt
                        FROM listings l
                        WHERE l.created_at >= :from AND l.created_at < :to
                        GROUP BY CAST(timezone('Asia/Ho_Chi_Minh', l.created_at) AS date)
                        ORDER BY CAST(timezone('Asia/Ho_Chi_Minh', l.created_at) AS date)
                        """)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            Number created = (Number) row[1];
            Number submitted = (Number) row[2];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", row[0].toString());
            m.put("created_cnt", created != null ? created.longValue() : 0L);
            m.put("submitted_cnt", submitted != null ? submitted.longValue() : 0L);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> packageSales(Timestamp from, Timestamp to, Map<String, Integer> rankByCode) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT sp.code,
                               sp.name,
                               CAST(COUNT(po.id) AS bigint) AS cnt,
                               CAST(COALESCE(SUM(po.amount_vnd), 0) AS numeric) AS revenue
                        FROM payment_orders po
                        JOIN subscription_packages sp ON sp.id = po.package_id
                        WHERE po.status = 'PAID'
                          AND po.created_at >= :from
                          AND po.created_at < :to
                        GROUP BY sp.code, sp.name, sp.id, sp.price_vnd
                        ORDER BY COALESCE(SUM(po.amount_vnd), 0) DESC
                        """)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            String code = row[0].toString();
            BigDecimal revenue = toBigDecimal(row[3]);
            Number cnt = (row[2] instanceof Number n) ? n : null;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", code);
            m.put("name", row[1]);
            m.put("cnt", cnt != null ? cnt.longValue() : 0L);
            m.put("revenue", revenue.longValue());
            m.put(
                    "package_rank",
                    rankByCode.getOrDefault(code.toLowerCase(Locale.ROOT), 0)
            );
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> topLandlords(Timestamp from, Timestamp to) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT u.id,
                               u.email,
                               CAST(COALESCE(NULLIF(trim(u.full_name), ''), u.email) AS text) AS full_name,
                               CAST(COUNT(r.id) AS bigint) AS rooms_created,
                               CAST(SUM(CASE WHEN r.status IN ('PENDING_REVIEW', 'PUBLISHED')
                                        THEN 1 ELSE 0 END) AS bigint) AS rooms_submitted
                        FROM listings r
                        JOIN app_users u ON u.id = r.owner_id
                        WHERE r.created_at >= :from AND r.created_at < :to
                        GROUP BY u.id, u.email, u.full_name
                        ORDER BY 5 DESC NULLS LAST, 4 DESC NULLS LAST
                        LIMIT 10
                        """)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            Number id = (Number) row[0];
            Number roomsCreated = (Number) row[3];
            Number roomsSubmitted = (Number) row[4];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id.longValue());
            m.put("email", row[1]);
            m.put("full_name", row[2]);
            m.put("rooms_created", roomsCreated != null ? roomsCreated.longValue() : 0L);
            m.put("rooms_submitted", roomsSubmitted != null ? roomsSubmitted.longValue() : 0L);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> toDailyCntRows(List<Object[]> rows) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            Number cnt = (Number) row[1];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", row[0].toString());
            m.put("cnt", cnt != null ? cnt.longValue() : 0L);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> toListingStatusBuckets() {
        List<Map<String, Object>> buckets = new ArrayList<>();
        for (Object[] row : listingRepository.countGroupedByStatus()) {
            ListingStatus st = (ListingStatus) row[0];
            Number cnt = (Number) row[1];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("status", mapListingStatusForCompat(st));
            m.put("cnt", cnt.longValue());
            buckets.add(m);
        }
        return buckets;
    }

    private List<Map<String, Object>> toArticleStatusBuckets() {
        List<Map<String, Object>> buckets = new ArrayList<>();
        for (Object[] row : articleRepository.countGroupedByStatusActive()) {
            ArticleStatus st = (ArticleStatus) row[0];
            Number cnt = (Number) row[1];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("status", mapArticleStatusForCompat(st));
            m.put("cnt", cnt.longValue());
            buckets.add(m);
        }
        return buckets;
    }

    /** Giá trị status giống trường dữ liệu Node + labels front-end dashboard. */
    private static String mapListingStatusForCompat(ListingStatus s) {
        if (s == null) return "unknown";
        return switch (s) {
            case DRAFT -> "draft";
            case PENDING_REVIEW -> "pending";
            case PUBLISHED -> "approved";
            case REJECTED -> "rejected";
            case EXPIRED -> "expired";
            case HIDDEN -> "hidden";
        };
    }

    private static String mapArticleStatusForCompat(ArticleStatus s) {
        if (s == null) return "unknown";
        return switch (s) {
            case DRAFT -> "draft";
            case PENDING_REVIEW -> "pending";
            case PUBLISHED -> "published";
            case ARCHIVED -> "archived";
        };
    }
}
