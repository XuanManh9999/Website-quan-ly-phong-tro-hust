package com.hust.roomrental.dto.article;

import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.ArticleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record ArticleUpsertRequest(
        @NotBlank @Size(max = 200) String slug,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 500) String excerpt,
        String body,
        @NotNull ArticleType type,
        ArticleStatus status,
        String coverUrl,
        Long categoryId,
        Set<Long> tagIds,
        String metaTitle,
        String metaDescription
) {
}
