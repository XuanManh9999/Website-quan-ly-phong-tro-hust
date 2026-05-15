package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.ArticleTag;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ArticleTagRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/post-tags")
public class PostTagsController {

    private final ArticleTagRepository articleTagRepository;

    @GetMapping
    public Map<String, Object> listPublic() {
        List<Map<String, Object>> tags = articleTagRepository.findAll().stream()
                .sorted(Comparator.comparing(ArticleTag::getName, String.CASE_INSENSITIVE_ORDER).thenComparing(ArticleTag::getId))
                .map(this::toCompat)
                .toList();
        return Map.of("tags", tags);
    }

    @GetMapping("/admin/list")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> listAdmin() {
        return listPublic();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody UpsertTagRequest request) {
        String slug = normalizeSlug(request.slug(), request.name());
        articleTagRepository.findBySlug(slug).ifPresent(t -> {
            throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        });
        ArticleTag t = ArticleTag.builder()
                .name(request.name())
                .slug(slug)
                .build();
        t = articleTagRepository.save(t);
        return Map.of("tag", toCompat(t));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> update(@PathVariable Long id, @Valid @RequestBody UpsertTagRequest request) {
        ArticleTag t = articleTagRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TAG_NOT_FOUND", "Không tìm thấy thẻ"));
        String slug = normalizeSlug(request.slug(), request.name());
        articleTagRepository.findBySlug(slug).ifPresent(existing -> {
            if (!existing.getId().equals(id)) throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        });
        t.setName(request.name());
        t.setSlug(slug);
        t = articleTagRepository.save(t);
        return Map.of("tag", toCompat(t));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> remove(@PathVariable Long id) {
        if (!articleTagRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "TAG_NOT_FOUND", "Không tìm thấy thẻ");
        }
        articleTagRepository.deleteById(id);
        return Map.of("ok", true);
    }

    private Map<String, Object> toCompat(ArticleTag t) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        m.put("slug", t.getSlug());
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

    public record UpsertTagRequest(@NotBlank String name, String slug) {}
}

