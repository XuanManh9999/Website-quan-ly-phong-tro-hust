package com.hust.roomrental.service.mapper;

import com.hust.roomrental.domain.entity.Article;
import com.hust.roomrental.dto.article.ArticleDetailResponse;
import com.hust.roomrental.dto.article.ArticleSummaryResponse;

import java.util.stream.Collectors;

public final class ArticleMapper {

    private ArticleMapper() {
    }

    public static ArticleSummaryResponse toSummary(Article a) {
        return new ArticleSummaryResponse(
                a.getId(),
                a.getSlug(),
                a.getTitle(),
                a.getExcerpt(),
                a.getType(),
                a.getCoverUrl(),
                a.getCategory() != null ? a.getCategory().getName() : null,
                a.getAuthor().getFullName() != null ? a.getAuthor().getFullName() : a.getAuthor().getEmail(),
                a.getPublishedAt(),
                a.getViewCount()
        );
    }

    public static ArticleDetailResponse toDetail(Article a) {
        var tags = a.getTags().stream().map(t -> t.getName()).collect(Collectors.toSet());
        var tagIds = a.getTags().stream().map(t -> t.getId()).collect(Collectors.toSet());
        return new ArticleDetailResponse(
                a.getId(),
                a.getSlug(),
                a.getTitle(),
                a.getExcerpt(),
                a.getBody(),
                a.getType(),
                a.getStatus(),
                a.getCoverUrl(),
                a.getCategory() != null ? a.getCategory().getId() : null,
                a.getCategory() != null ? a.getCategory().getName() : null,
                tags,
                tagIds,
                a.getAuthor().getFullName() != null ? a.getAuthor().getFullName() : a.getAuthor().getEmail(),
                a.getPublishedAt(),
                a.getViewCount(),
                a.getMetaTitle(),
                a.getMetaDescription(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
