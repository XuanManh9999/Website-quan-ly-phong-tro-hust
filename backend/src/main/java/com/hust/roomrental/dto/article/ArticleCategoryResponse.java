package com.hust.roomrental.dto.article;

public record ArticleCategoryResponse(
        Long id,
        String name,
        String slug,
        Long parentId,
        int sortOrder
) {
}

