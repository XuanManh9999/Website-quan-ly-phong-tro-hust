package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.ArticleComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleCommentRepository extends JpaRepository<ArticleComment, Long> {

    @EntityGraph(attributePaths = {"user"})
    Page<ArticleComment> findByArticleIdAndParentIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(Long articleId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "parent"})
    List<ArticleComment> findByParentIdInAndDeletedAtIsNullOrderByCreatedAtAsc(List<Long> parentIds);

    long countByArticleIdAndDeletedAtIsNull(Long articleId);

    boolean existsByIdAndArticleIdAndDeletedAtIsNull(Long id, Long articleId);

    boolean existsByParentIdAndDeletedAtIsNull(Long parentId);
}
