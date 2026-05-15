package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.StaticPage;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.StaticPageRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/pages")
public class StaticPagesController {

    private final StaticPageRepository staticPageRepository;

    @GetMapping("/{slug}")
    public Map<String, Object> getPublic(@PathVariable String slug) {
        StaticPage p = staticPageRepository.findBySlugAndPublishedIsTrue(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PAGE_NOT_FOUND", "Không tìm thấy trang"));
        return Map.of("page", toPublic(p));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminList() {
        List<Map<String, Object>> items = staticPageRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toAdmin)
                .toList();
        return Map.of("items", items);
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminDetail(@PathVariable Long id) {
        StaticPage p = staticPageRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PAGE_NOT_FOUND", "Không tìm thấy trang"));
        return Map.of("page", toAdmin(p));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> adminCreate(@Valid @RequestBody UpsertPageRequest req) {
        String slug = normalizeSlug(req.slug());
        staticPageRepository.findBySlug(slug).ifPresent(x -> {
            throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        });
        StaticPage p = StaticPage.builder()
                .slug(slug)
                .title(req.title().trim())
                .contentHtml(req.contentHtml())
                .published(Boolean.TRUE.equals(req.published()))
                .build();
        p = staticPageRepository.save(p);
        return Map.of("page", toAdmin(p));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminUpdate(@PathVariable Long id, @Valid @RequestBody UpsertPageRequest req) {
        StaticPage p = staticPageRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PAGE_NOT_FOUND", "Không tìm thấy trang"));
        String slug = normalizeSlug(req.slug());
        staticPageRepository.findBySlug(slug).ifPresent(x -> {
            if (!x.getId().equals(id)) throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        });
        p.setSlug(slug);
        p.setTitle(req.title().trim());
        p.setContentHtml(req.contentHtml());
        p.setPublished(Boolean.TRUE.equals(req.published()));
        p = staticPageRepository.save(p);
        return Map.of("page", toAdmin(p));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminDelete(@PathVariable Long id) {
        if (!staticPageRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PAGE_NOT_FOUND", "Không tìm thấy trang");
        }
        staticPageRepository.deleteById(id);
        return Map.of("ok", true);
    }

    private String normalizeSlug(String slug) {
        String s = slug == null ? "" : slug.trim().toLowerCase();
        if (s.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SLUG", "Thiếu slug");
        s = s.replaceAll("[^a-z0-9-]", "-").replaceAll("-{2,}", "-");
        if (s.startsWith("-")) s = s.substring(1);
        if (s.endsWith("-")) s = s.substring(0, s.length() - 1);
        if (s.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SLUG", "Slug không hợp lệ");
        return s;
    }

    private Map<String, Object> toPublic(StaticPage p) {
        Map<String, Object> m = new HashMap<>();
        m.put("slug", p.getSlug());
        m.put("title", p.getTitle());
        m.put("content_html", p.getContentHtml());
        m.put("updated_at", p.getUpdatedAt());
        return m;
    }

    private Map<String, Object> toAdmin(StaticPage p) {
        Map<String, Object> m = toPublic(p);
        m.put("id", p.getId());
        m.put("published", p.isPublished());
        m.put("created_at", p.getCreatedAt());
        return m;
    }

    public record UpsertPageRequest(
            @NotBlank @Size(max = 80) String slug,
            @NotBlank @Size(max = 200) String title,
            String contentHtml,
            Boolean published
    ) {}
}

