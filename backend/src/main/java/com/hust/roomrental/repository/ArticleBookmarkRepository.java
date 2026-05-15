package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.ArticleBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleBookmarkRepository extends JpaRepository<ArticleBookmark, Long> {

    boolean existsByUserIdAndArticleId(Long userId, Long articleId);

    Optional<ArticleBookmark> findByUserIdAndArticleId(Long userId, Long articleId);

    @EntityGraph(attributePaths = {"article", "article.category", "article.author"})
    Page<ArticleBookmark> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    void deleteByUserIdAndArticleId(Long userId, Long articleId);

    long countByArticleId(Long articleId);
}
