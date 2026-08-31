package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.Article;
import com.hust.roomrental.domain.entity.ArticleBookmark;
import com.hust.roomrental.domain.entity.ArticleComment;
import com.hust.roomrental.domain.entity.ArticleLike;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.ArticleType;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.article.ArticleUpsertRequest;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ArticleBookmarkRepository;
import com.hust.roomrental.repository.ArticleCategoryRepository;
import com.hust.roomrental.repository.ArticleCommentRepository;
import com.hust.roomrental.repository.ArticleLikeRepository;
import com.hust.roomrental.repository.ArticleRepository;
import com.hust.roomrental.service.ArticleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class PostsController {

    private final ArticleService articleService;
    private final ArticleRepository articleRepository;
    private final ArticleCategoryRepository articleCategoryRepository;
    private final ArticleBookmarkRepository articleBookmarkRepository;
    private final ArticleLikeRepository articleLikeRepository;
    private final ArticleCommentRepository articleCommentRepository;

    @GetMapping
    public Map<String, Object> listPublic(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long excludeId
    ) {
        int safeLimit = limit == null || limit <= 0 ? 10 : Math.min(limit, 100);
        int safeOffset = offset == null || offset < 0 ? 0 : offset;
        int page = safeOffset / safeLimit;

        String categorySlug = null;
        if (categoryId != null && !categoryId.isBlank()) {
            try {
                long id = Long.parseLong(categoryId);
                categorySlug = articleCategoryRepository.findById(id).map(c -> c.getSlug()).orElse(null);
            } catch (Exception ignored) {
                categorySlug = null;
            }
        }

        Pageable pageable = PageRequest.of(page, safeLimit, Sort.by(Sort.Direction.DESC, "publishedAt"));
        PageResponse<com.hust.roomrental.dto.article.ArticleSummaryResponse> result =
                articleService.searchPublished(categorySlug, emptyToNull(keyword), pageable);

        List<Map<String, Object>> posts = result.content().stream()
                .filter(p -> excludeId == null || !Objects.equals(p.id(), excludeId))
                .map(this::toCompatPublicPost)
                .toList();

        return Map.of(
                "posts", posts,
                "total", result.totalElements(),
                "limit", safeLimit,
                "offset", safeOffset
        );
    }

    @GetMapping("/me/bookmarks")
    public Map<String, Object> myBookmarks(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = articleBookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<Map<String, Object>> bookmarks = result.getContent().stream().map(b -> {
            Article a = b.getArticle();
            Map<String, Object> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("post_id", a.getId());
            m.put("slug", a.getSlug());
            m.put("post_slug", a.getSlug());
            m.put("title", a.getTitle());
            m.put("excerpt", a.getExcerpt());
            m.put("category_name", a.getCategory() != null ? a.getCategory().getName() : null);
            m.put("published_at", a.getPublishedAt());
            return m;
        }).toList();
        return Map.of(
                "items", bookmarks,
                "bookmarks", bookmarks,
                "page", safePage,
                "limit", safeLimit,
                "total", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/me/likes")
    public Map<String, Object> myLikes(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = articleLikeRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<Map<String, Object>> likes = result.getContent().stream().map(l -> {
            Article a = l.getArticle();
            Map<String, Object> m = new HashMap<>();
            m.put("id", l.getId());
            m.put("post_id", a.getId());
            m.put("slug", a.getSlug());
            m.put("post_slug", a.getSlug());
            m.put("title", a.getTitle());
            m.put("excerpt", a.getExcerpt());
            m.put("category_name", a.getCategory() != null ? a.getCategory().getName() : null);
            m.put("published_at", a.getPublishedAt());
            return m;
        }).toList();
        return Map.of(
                "items", likes,
                "likes", likes,
                "page", safePage,
                "limit", safeLimit,
                "total", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/{slug}")
    public Map<String, Object> detail(
            @PathVariable String slug,
            @AuthenticationPrincipal User user
    ) {
        var d = articleService.getPublishedBySlug(slug);
        return Map.of("post", toCompatDetailPost(d, user));
    }

    @GetMapping("/admin/list")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> listAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "updatedAt"));
        PageResponse<com.hust.roomrental.dto.article.ArticleDetailResponse> data = articleService.listForAdmin(pageable);

        List<Map<String, Object>> filtered = data.content().stream()
                .filter(p -> matchesSearch(p, search))
                .filter(p -> matchesStatus(p.status(), status))
                .map(this::toCompatAdminPost)
                .toList();

        int total = filtered.size();
        return Map.of(
                "items", filtered,
                "total", total,
                "totalPages", total == 0 ? 1 : (int) Math.ceil((double) total / safeLimit)
        );
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> adminDetail(@PathVariable Long id) {
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
        var d = articleRepository.findDetailBySlug(a.getSlug())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
        return Map.of("post", toCompatDetailPost(com.hust.roomrental.service.mapper.ArticleMapper.toDetail(d), null));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> adminCreate(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CompatPostUpsertRequest request
    ) {
        var created = articleService.create(user, toArticleUpsertRequest(request));
        return Map.of("post", toCompatDetailPost(created, null));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> adminUpdate(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody CompatPostUpsertRequest request
    ) {
        var updated = articleService.update(user, id, toArticleUpsertRequest(request));
        return Map.of("post", toCompatDetailPost(updated, null));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> adminRemove(@AuthenticationPrincipal User user, @PathVariable Long id) {
        articleService.softDelete(user, id);
        return Map.of("ok", true);
    }

    @PatchMapping("/admin/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> adminPublish(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
        var updated = articleService.update(user, id, toPublishRequest(a, ArticleStatus.PUBLISHED));
        return Map.of("post", toCompatDetailPost(updated, null));
    }

    @PatchMapping("/admin/{id}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public Map<String, Object> adminUnpublish(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
        var updated = articleService.update(user, id, toPublishRequest(a, ArticleStatus.DRAFT));
        return Map.of("post", toCompatDetailPost(updated, null));
    }

    @GetMapping("/{id}/bookmarks")
    public Map<String, Object> bookmarkStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        return Map.of("bookmarked", articleBookmarkRepository.existsByUserIdAndArticleId(user.getId(), id));
    }

    @PostMapping("/{id}/bookmarks")
    public Map<String, Object> bookmarkAdd(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        if (!articleBookmarkRepository.existsByUserIdAndArticleId(user.getId(), id)) {
            Article article = articleRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
            articleBookmarkRepository.save(ArticleBookmark.builder().user(user).article(article).build());
        }
        return Map.of("ok", true, "bookmarked", true);
    }

    @DeleteMapping("/{id}/bookmarks")
    public Map<String, Object> bookmarkRemove(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        articleBookmarkRepository.deleteByUserIdAndArticleId(user.getId(), id);
        return Map.of("ok", true, "bookmarked", false);
    }

    @GetMapping("/{id}/likes")
    public Map<String, Object> likeStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        boolean liked = user != null && articleLikeRepository.existsByUserIdAndArticleId(user.getId(), id);
        long likeCount = articleLikeRepository.countByArticleId(id);
        return Map.of("liked", liked, "likeCount", likeCount);
    }

    @PostMapping("/{id}/likes")
    public Map<String, Object> likeAdd(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        if (!articleLikeRepository.existsByUserIdAndArticleId(user.getId(), id)) {
            Article article = articleRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
            articleLikeRepository.save(ArticleLike.builder().user(user).article(article).build());
        }
        return Map.of(
                "ok", true,
                "liked", true,
                "likeCount", articleLikeRepository.countByArticleId(id)
        );
    }

    @DeleteMapping("/{id}/likes")
    public Map<String, Object> likeRemove(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        articleLikeRepository.deleteByUserIdAndArticleId(user.getId(), id);
        return Map.of(
                "ok", true,
                "liked", false,
                "likeCount", articleLikeRepository.countByArticleId(id)
        );
    }

    @GetMapping("/{id}/comments")
    public Map<String, Object> comments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal User user
    ) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 50));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        var rootsPage = articleCommentRepository.findByArticleIdAndParentIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(id, pageable);
        List<ArticleComment> roots = rootsPage.getContent();
        List<Long> rootIds = roots.stream().map(ArticleComment::getId).toList();
        List<ArticleComment> replies = rootIds.isEmpty()
                ? List.of()
                : articleCommentRepository.findByParentIdInAndDeletedAtIsNullOrderByCreatedAtAsc(rootIds);
        Map<Long, List<Map<String, Object>>> childrenByParent = new HashMap<>();
        for (ArticleComment r : replies) {
            Long parentId = r.getParent() != null ? r.getParent().getId() : null;
            if (parentId != null) {
                childrenByParent.computeIfAbsent(parentId, k -> new ArrayList<>()).add(toCommentResponse(r, user));
            }
        }
        List<Map<String, Object>> rootDtos = roots.stream().map(c -> {
            Map<String, Object> item = toCommentResponse(c, user);
            item.put("replies", childrenByParent.getOrDefault(c.getId(), List.of()));
            return item;
        }).toList();
        return Map.of(
                "comments", rootDtos,
                "total", rootsPage.getTotalElements(),
                "page", safePage,
                "limit", safeLimit,
                "totalPages", rootsPage.getTotalPages()
        );
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Không tìm thấy bài viết"));
        String content = request.content() == null ? "" : request.content().trim();
        if (content.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_EMPTY", "Nội dung bình luận không được để trống");
        }
        ArticleComment parent = null;
        if (request.parentId() != null) {
            parent = articleCommentRepository.findById(request.parentId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COMMENT_NOT_FOUND", "Không tìm thấy bình luận cha"));
            if (!articleCommentRepository.existsByIdAndArticleIdAndDeletedAtIsNull(parent.getId(), id)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_INVALID_PARENT", "Bình luận cha không thuộc bài viết này");
            }
        }
        ArticleComment created = articleCommentRepository.save(
                ArticleComment.builder()
                        .article(article)
                        .user(user)
                        .parent(parent)
                        .content(content)
                        .build()
        );
        return Map.of(
                "ok", true,
                "comment", toCommentResponse(created, user)
        );
    }

    @PatchMapping("/{id}/comments/{commentId}")
    @Transactional
    public Map<String, Object> updateComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        ArticleComment comment = articleCommentRepository.findWithUserAndParentById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COMMENT_NOT_FOUND", "Không tìm thấy bình luận"));
        if (!articleCommentRepository.existsByIdAndArticleIdAndDeletedAtIsNull(commentId, id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_INVALID", "Bình luận không thuộc bài viết này");
        }
        if (!Objects.equals(comment.getUser().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "COMMENT_FORBIDDEN", "Bạn chỉ có thể sửa bình luận của chính mình");
        }
        String content = request.content() == null ? "" : request.content().trim();
        if (content.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_EMPTY", "Nội dung bình luận không được để trống");
        }
        comment.setContent(content);
        comment = articleCommentRepository.save(comment);
        return Map.of("ok", true, "comment", toCommentResponse(comment, user));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    @Transactional
    public Map<String, Object> deleteComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long commentId
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        ArticleComment comment = articleCommentRepository.findWithUserAndParentById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COMMENT_NOT_FOUND", "Không tìm thấy bình luận"));
        if (!articleCommentRepository.existsByIdAndArticleIdAndDeletedAtIsNull(commentId, id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_INVALID", "Bình luận không thuộc bài viết này");
        }
        if (!Objects.equals(comment.getUser().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "COMMENT_FORBIDDEN", "Bạn chỉ có thể xoá bình luận của chính mình");
        }
        if (articleCommentRepository.existsByParentIdAndDeletedAtIsNull(commentId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_HAS_REPLIES", "Không thể xoá bình luận đã có trả lời");
        }
        comment.setDeletedAt(java.time.Instant.now());
        articleCommentRepository.save(comment);
        return Map.of("ok", true);
    }



    private ArticleUpsertRequest toPublishRequest(Article a, ArticleStatus status) {
        return new ArticleUpsertRequest(
                a.getSlug(),
                a.getTitle(),
                a.getExcerpt(),
                a.getBody(),
                a.getType(),
                status,
                a.getCoverUrl(),
                a.getCategory() != null ? a.getCategory().getId() : null,
                a.getTags().stream().map(t -> t.getId()).collect(java.util.stream.Collectors.toSet()),
                a.getMetaTitle(),
                a.getMetaDescription()
        );
    }

    private ArticleUpsertRequest toArticleUpsertRequest(CompatPostUpsertRequest req) {
        String slug = req.slug() == null || req.slug().isBlank()
                ? req.title().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", "").replaceAll("\\s+", "-")
                : req.slug();
        Long categoryId = req.categoryId();
        if (categoryId == null && req.category_id() != null) categoryId = req.category_id();
        return new ArticleUpsertRequest(
                slug,
                req.title(),
                req.excerpt(),
                req.contentHtml(),
                ArticleType.BLOG,
                parseStatus(req.status()),
                req.coverImageUrl(),
                categoryId,
                req.tagIds(),
                req.metaTitle(),
                req.metaDescription()
        );
    }

    private ArticleStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return ArticleStatus.DRAFT;
        return "published".equalsIgnoreCase(status) ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
    }

    private boolean matchesSearch(com.hust.roomrental.dto.article.ArticleDetailResponse p, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase(Locale.ROOT);
        return (p.title() != null && p.title().toLowerCase(Locale.ROOT).contains(q))
                || (p.slug() != null && p.slug().toLowerCase(Locale.ROOT).contains(q));
    }

    private boolean matchesStatus(ArticleStatus status, String filter) {
        if (filter == null || filter.isBlank()) return true;
        if ("published".equalsIgnoreCase(filter)) return status == ArticleStatus.PUBLISHED;
        if ("draft".equalsIgnoreCase(filter)) return status != ArticleStatus.PUBLISHED;
        return true;
    }

    private Map<String, Object> toCompatPublicPost(com.hust.roomrental.dto.article.ArticleSummaryResponse p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.id());
        m.put("slug", p.slug());
        m.put("title", p.title());
        m.put("excerpt", p.excerpt());
        m.put("cover_image_url", p.coverUrl());
        m.put("category_name", p.categoryName());
        m.put("author_full_name", p.authorName());
        m.put("published_at", p.publishedAt());
        return m;
    }

    private Map<String, Object> toCompatAdminPost(com.hust.roomrental.dto.article.ArticleDetailResponse p) {
        Map<String, Object> m = toCompatDetailPost(p, null);
        m.put("status", p.status() == ArticleStatus.PUBLISHED ? "published" : "draft");
        return m;
    }

    private Map<String, Object> toCompatDetailPost(com.hust.roomrental.dto.article.ArticleDetailResponse p, User user) {
        Map<String, Object> m = new HashMap<>();
        long likeCount = articleLikeRepository.countByArticleId(p.id());
        long commentCount = articleCommentRepository.countByArticleIdAndDeletedAtIsNull(p.id());
        long bookmarkCount = articleBookmarkRepository.countByArticleId(p.id());
        boolean liked = user != null && articleLikeRepository.existsByUserIdAndArticleId(user.getId(), p.id());
        boolean bookmarked = user != null && articleBookmarkRepository.existsByUserIdAndArticleId(user.getId(), p.id());
        m.put("id", p.id());
        m.put("slug", p.slug());
        m.put("title", p.title());
        m.put("excerpt", p.excerpt());
        m.put("content_html", p.body());
        m.put("cover_image_url", p.coverUrl());
        m.put("category_id", p.categoryId());
        m.put("category_name", p.categoryName());
        m.put("author_full_name", p.authorName());
        m.put("published_at", p.publishedAt());
        m.put("status", p.status() == ArticleStatus.PUBLISHED ? "published" : "draft");
        m.put("meta_title", p.metaTitle());
        m.put("meta_description", p.metaDescription());
        m.put("tag_names", p.tagNames());
        m.put("tag_ids", p.tagIds());
        m.put("like_count", likeCount);
        m.put("comment_count", commentCount);
        m.put("bookmark_count", bookmarkCount);
        m.put("liked", liked);
        m.put("bookmarked", bookmarked);
        return m;
    }

    private Map<String, Object> toCommentResponse(ArticleComment c, User currentUser) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("content", c.getContent());
        m.put("created_at", c.getCreatedAt());
        m.put("updated_at", c.getUpdatedAt());
        m.put("parent_id", c.getParent() != null ? c.getParent().getId() : null);
        m.put("user_id", c.getUser().getId());
        m.put("user_name", c.getUser().getFullName() != null && !c.getUser().getFullName().isBlank()
                ? c.getUser().getFullName()
                : c.getUser().getEmail());
        m.put("can_edit", currentUser != null && Objects.equals(currentUser.getId(), c.getUser().getId()));
        return m;
    }

    private String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    public record CompatPostUpsertRequest(
            @NotBlank String title,
            String slug,
            String excerpt,
            String contentHtml,
            String coverImageUrl,
            String status,
            Long categoryId,
            Long category_id,
            Set<Long> tagIds,
            String metaTitle,
            String metaDescription
    ) {}

    public record AddCommentRequest(
            @NotBlank String content,
            Long parentId
    ) {}

    public record UpdateCommentRequest(
            @NotBlank String content
    ) {}
}
