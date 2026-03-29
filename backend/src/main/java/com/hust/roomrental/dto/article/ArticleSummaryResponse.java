package com.hust.roomrental.dto.article;

import com.hust.roomrental.domain.enums.ArticleType;

import java.time.Instant;

public record ArticleSummaryResponse(
        Long id,
        String slug,
        String title,
        String excerpt,
        ArticleType type,
        String coverUrl,
        String categoryName,
        String authorName,
        Instant publishedAt,
        long viewCount
) {
}
