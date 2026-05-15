package com.hust.roomrental.dto.article;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ArticleCategoryUpsertRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 160) String slug,
        Long parentId,
        int sortOrder
) {
}

