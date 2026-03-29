package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.ArticleTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleTagRepository extends JpaRepository<ArticleTag, Long> {

    Optional<ArticleTag> findBySlug(String slug);
}
