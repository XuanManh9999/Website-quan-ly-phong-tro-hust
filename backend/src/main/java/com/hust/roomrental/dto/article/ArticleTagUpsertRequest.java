package com.hust.roomrental.dto.article;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ArticleTagUpsertRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 120) String slug
) {
}

