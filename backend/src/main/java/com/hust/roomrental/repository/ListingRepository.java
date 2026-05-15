package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.enums.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    @EntityGraph(attributePaths = {"owner", "images"})
    @Query("SELECT l FROM Listing l WHERE l.id = :id")
    Optional<Listing> findDetailById(@Param("id") Long id);

    Page<Listing> findByStatus(ListingStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"owner"})
    Page<Listing> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Listing> findByOwnerIdAndStatus(Long ownerId, ListingStatus status, Pageable pageable);

    @Query("SELECT l.createdAt, l.status FROM Listing l WHERE l.createdAt >= :from AND l.createdAt < :to")
    List<Object[]> findTimelineRowsBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query(value = """
            SELECT l.id
            FROM listings l
            WHERE l.status = ?1
              AND (?2 IS NULL OR l.district = ?2)
              AND (?3 IS NULL OR CAST(l.title AS text) ILIKE CONCAT('%', ?3, '%')
                   OR CAST(l.address AS text) ILIKE CONCAT('%', ?3, '%'))
              AND (?4 IS NULL OR l.price >= ?4)
              AND (?5 IS NULL OR l.price <= ?5)
              AND (?6 IS NULL OR l.area_m2 >= ?6)
              AND (?7 IS NULL OR l.area_m2 <= ?7)
              AND (?8 IS NULL OR CAST(l.address AS text) ILIKE CONCAT('%', ?8, '%'))
              AND (?9 IS NULL OR CAST(l.address AS text) ILIKE CONCAT('%', ?9, '%'))
            ORDER BY
              CASE WHEN ?10 = 'priceAsc' THEN l.price END ASC,
              CASE WHEN ?10 = 'priceDesc' THEN l.price END DESC,
              l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM listings l
            WHERE l.status = ?1
              AND (?2 IS NULL OR l.district = ?2)
              AND (?3 IS NULL OR CAST(l.title AS text) ILIKE CONCAT('%', ?3, '%')
                   OR CAST(l.address AS text) ILIKE CONCAT('%', ?3, '%'))
              AND (?4 IS NULL OR l.price >= ?4)
              AND (?5 IS NULL OR l.price <= ?5)
              AND (?6 IS NULL OR l.area_m2 >= ?6)
              AND (?7 IS NULL OR l.area_m2 <= ?7)
              AND (?8 IS NULL OR CAST(l.address AS text) ILIKE CONCAT('%', ?8, '%'))
              AND (?9 IS NULL OR CAST(l.address AS text) ILIKE CONCAT('%', ?9, '%'))
            """,
            nativeQuery = true)
    Page<Long> searchPublicIds(
            String status,
            String district,
            String q,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Double minArea,
            Double maxArea,
            String ward,
            String province,
            String sort,
            Pageable pageable
    );

    @Query("SELECT DISTINCT l FROM Listing l LEFT JOIN FETCH l.owner LEFT JOIN FETCH l.images WHERE l.id IN :ids")
    List<Listing> findAllWithOwnerAndImagesByIdIn(@Param("ids") Collection<Long> ids);

    /**
     * Public search: native SQL for filters/sort + pagination, then one JPQL fetch for owner/images
     * to avoid N+1 lazy loads per row.
     */
    default Page<Listing> searchPublic(
            String status,
            String district,
            String q,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Double minArea,
            Double maxArea,
            String ward,
            String province,
            String sort,
            Pageable pageable
    ) {
        Page<Long> idPage = searchPublicIds(
                status, district, q, minPrice, maxPrice, minArea, maxArea, ward, province, sort, pageable);
        if (!idPage.hasContent()) {
            return new PageImpl<>(List.of(), pageable, idPage.getTotalElements());
        }
        List<Long> ids = idPage.getContent();
        List<Listing> loaded = findAllWithOwnerAndImagesByIdIn(ids);
        Map<Long, Integer> order = new HashMap<>();
        for (int i = 0; i < ids.size(); i++) {
            order.put(ids.get(i), i);
        }
        loaded.sort(Comparator.comparingInt(l -> order.get(l.getId())));
        return new PageImpl<>(loaded, pageable, idPage.getTotalElements());
    }

    @Query("""
            SELECT COUNT(l) FROM Listing l
            WHERE l.owner.id = :ownerId
            AND l.status = 'PUBLISHED'
            AND l.publishedAt IS NOT NULL
            AND l.publishedAt >= :start AND l.publishedAt < :end
            """)
    long countPublishedInMonth(@Param("ownerId") Long ownerId, @Param("start") Instant start, @Param("end") Instant end);

    long countByStatus(ListingStatus status);

    @Query("SELECT l.status, COUNT(l) FROM Listing l GROUP BY l.status")
    List<Object[]> countGroupedByStatus();

    @Query("""
            SELECT r.owner.id, r.owner.email, r.owner.fullName, COUNT(r.id),
                   SUM(CASE WHEN r.status IN :active THEN 1 ELSE 0 END)
            FROM Listing r
            WHERE r.createdAt >= :from AND r.createdAt < :to
            GROUP BY r.owner.id, r.owner.email, r.owner.fullName
            """)
    List<Object[]> landlordRoomStatsBetween(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("active") Collection<ListingStatus> submittedStatuses
    );
}
