package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    Optional<Favorite> findByUserIdAndListingId(Long userId, Long listingId);

    Page<Favorite> findByUserId(Long userId, Pageable pageable);

    void deleteByUserIdAndListingId(Long userId, Long listingId);
}
