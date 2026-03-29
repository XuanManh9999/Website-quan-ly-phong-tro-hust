package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.enums.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    @EntityGraph(attributePaths = {"owner", "images"})
    @Query("SELECT l FROM Listing l WHERE l.id = :id")
    Optional<Listing> findDetailById(@Param("id") Long id);

    Page<Listing> findByStatus(ListingStatus status, Pageable pageable);

    Page<Listing> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Listing> findByOwnerIdAndStatus(Long ownerId, ListingStatus status, Pageable pageable);

    @Query("""
            SELECT l FROM Listing l
            WHERE l.status = :status
            AND (:district IS NULL OR l.district = :district)
            AND (:q IS NULL OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(l.address) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:minPrice IS NULL OR l.price >= :minPrice)
            AND (:maxPrice IS NULL OR l.price <= :maxPrice)
            """)
    Page<Listing> searchPublic(
            @Param("status") ListingStatus status,
            @Param("district") String district,
            @Param("q") String q,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(l) FROM Listing l
            WHERE l.owner.id = :ownerId
            AND l.status = 'PUBLISHED'
            AND l.publishedAt IS NOT NULL
            AND l.publishedAt >= :start AND l.publishedAt < :end
            """)
    long countPublishedInMonth(@Param("ownerId") Long ownerId, @Param("start") Instant start, @Param("end") Instant end);

    long countByStatus(ListingStatus status);
}
