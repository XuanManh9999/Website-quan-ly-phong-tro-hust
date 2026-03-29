package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {
}
