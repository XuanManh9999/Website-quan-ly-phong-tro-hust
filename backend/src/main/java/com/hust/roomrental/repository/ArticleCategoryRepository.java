package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.ArticleCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleCategoryRepository extends JpaRepository<ArticleCategory, Long> {

    Optional<ArticleCategory> findBySlug(String slug);
}
