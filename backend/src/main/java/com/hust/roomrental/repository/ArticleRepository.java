package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.Article;
import com.hust.roomrental.domain.enums.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    @Query("SELECT a FROM Article a WHERE a.slug = :slug AND a.deletedAt IS NULL")
    Optional<Article> findDetailBySlug(@Param("slug") String slug);

    Optional<Article> findBySlugAndDeletedAtIsNull(String slug);

    Page<Article> findByStatusAndDeletedAtIsNull(ArticleStatus status, Pageable pageable);

    @Query(value = """
            SELECT a.*
            FROM articles a
            LEFT JOIN article_categories c ON c.id = a.category_id
            WHERE a.status = 'PUBLISHED'
              AND a.deleted_at IS NULL
              AND (:categorySlug IS NULL OR c.slug = :categorySlug)
              AND (:q IS NULL OR CAST(a.title AS text) ILIKE CONCAT('%', :q, '%'))
            ORDER BY a.published_at DESC NULLS LAST
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM articles a
            LEFT JOIN article_categories c ON c.id = a.category_id
            WHERE a.status = 'PUBLISHED'
              AND a.deleted_at IS NULL
              AND (:categorySlug IS NULL OR c.slug = :categorySlug)
              AND (:q IS NULL OR CAST(a.title AS text) ILIKE CONCAT('%', :q, '%'))
            """,
            nativeQuery = true)
    Page<Article> searchPublished(
            @Param("categorySlug") String categorySlug,
            @Param("q") String q,
            Pageable pageable
    );

    long countByStatus(ArticleStatus status);

    Page<Article> findByDeletedAtIsNullOrderByUpdatedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(a) FROM Article a WHERE a.deletedAt IS NULL")
    long countActiveArticles();

    @Query("SELECT COUNT(a) FROM Article a WHERE a.deletedAt IS NULL AND a.status = :status")
    long countActiveByStatus(@Param("status") ArticleStatus status);

    @Query("SELECT a.status, COUNT(a) FROM Article a WHERE a.deletedAt IS NULL GROUP BY a.status")
    List<Object[]> countGroupedByStatusActive();
}
