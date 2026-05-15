package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.ArticleCategory;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ArticleCategoryRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@RestController
@RequiredArgsConstructor
@RequestMapping("/post-categories")
public class PostCategoriesController {

    private final ArticleCategoryRepository articleCategoryRepository;

    @GetMapping
    public Map<String, Object> listPublic() {
        List<Map<String, Object>> categories = articleCategoryRepository.findAll().stream()
                .sorted(Comparator.comparingInt(ArticleCategory::getSortOrder).thenComparing(ArticleCategory::getId))
                .map(this::toCompatCategory)
                .toList();
        return Map.of("categories", categories);
    }

    @GetMapping("/admin/list")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> listAdmin() {
        return listPublic();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody UpsertCategoryRequest request) {
        String slug = normalizeSlug(request.slug(), request.name());
        articleCategoryRepository.findBySlug(slug).ifPresent(c -> {
            throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        });
        ArticleCategory c = ArticleCategory.builder()
                .name(request.name())
                .slug(slug)
                .sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .build();
        c = articleCategoryRepository.save(c);
        return Map.of("category", toCompatCategory(c));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> update(@PathVariable Long id, @Valid @RequestBody UpsertCategoryRequest request) {
        ArticleCategory c = articleCategoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Không tìm thấy chủ đề"));
        String slug = normalizeSlug(request.slug(), request.name());
        articleCategoryRepository.findBySlug(slug).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
            }
        });
        c.setName(request.name());
        c.setSlug(slug);
        if (request.sortOrder() != null) {
            c.setSortOrder(request.sortOrder());
        }
        c = articleCategoryRepository.save(c);
        return Map.of("category", toCompatCategory(c));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> remove(@PathVariable Long id) {
        if (!articleCategoryRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Không tìm thấy chủ đề");
        }
        articleCategoryRepository.deleteById(id);
        return Map.of("ok", true);
    }

    private Map<String, Object> toCompatCategory(ArticleCategory c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("slug", c.getSlug());
        m.put("description", null);
        return m;
    }

    private String normalizeSlug(String slug, String fallbackName) {
        String value = slug == null || slug.isBlank() ? fallbackName : slug;
        String normalized = value.toLowerCase(Locale.ROOT).trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-{2,}", "-");
        if (normalized.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SLUG", "Slug không hợp lệ");
        }
        return normalized;
    }

    public record UpsertCategoryRequest(
            @NotBlank String name,
            String slug,
            String description,
            Integer sortOrder
    ) {}
}
