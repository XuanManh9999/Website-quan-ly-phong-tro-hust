package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.StaticPage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaticPageRepository extends JpaRepository<StaticPage, Long> {

    Optional<StaticPage> findBySlug(String slug);

    Optional<StaticPage> findBySlugAndPublishedIsTrue(String slug);

    List<StaticPage> findAllByOrderByUpdatedAtDesc();
}

