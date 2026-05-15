package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.ArticleLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleLikeRepository extends JpaRepository<ArticleLike, Long> {

    boolean existsByUserIdAndArticleId(Long userId, Long articleId);

    long countByArticleId(Long articleId);

    void deleteByUserIdAndArticleId(Long userId, Long articleId);

    @EntityGraph(attributePaths = {"article", "article.category", "article.author"})
    Page<ArticleLike> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
