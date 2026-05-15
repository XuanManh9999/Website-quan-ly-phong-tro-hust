package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.FaqItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqItemRepository extends JpaRepository<FaqItem, Long> {

    List<FaqItem> findByActiveIsTrueOrderBySortOrderAscUpdatedAtDesc();

    List<FaqItem> findAllByOrderBySortOrderAscUpdatedAtDesc();
}

