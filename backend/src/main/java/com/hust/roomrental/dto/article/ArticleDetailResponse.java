package com.hust.roomrental.dto.article;

import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.ArticleType;

import java.time.Instant;
import java.util.Set;

public record ArticleDetailResponse(
        Long id,
        String slug,
        String title,
        String excerpt,
        String body,
        ArticleType type,
        ArticleStatus status,
        String coverUrl,
        Long categoryId,
        String categoryName,
        Set<String> tagNames,
        String authorName,
        Instant publishedAt,
        long viewCount,
        String metaTitle,
        String metaDescription,
        Instant createdAt,
        Instant updatedAt
) {
}
