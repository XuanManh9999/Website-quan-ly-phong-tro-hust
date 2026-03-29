package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.Article;
import com.hust.roomrental.domain.enums.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    @Query("SELECT a FROM Article a WHERE a.slug = :slug AND a.deletedAt IS NULL")
    Optional<Article> findDetailBySlug(@Param("slug") String slug);

    Optional<Article> findBySlugAndDeletedAtIsNull(String slug);

    Page<Article> findByStatusAndDeletedAtIsNull(ArticleStatus status, Pageable pageable);

    @Query("""
            SELECT a FROM Article a
            WHERE a.status = 'PUBLISHED' AND a.deletedAt IS NULL
            AND (:categorySlug IS NULL OR a.category.slug = :categorySlug)
            AND (:q IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Article> searchPublished(
            @Param("categorySlug") String categorySlug,
            @Param("q") String q,
            Pageable pageable
    );

    long countByStatus(ArticleStatus status);

    Page<Article> findByDeletedAtIsNullOrderByUpdatedAtDesc(Pageable pageable);
}
