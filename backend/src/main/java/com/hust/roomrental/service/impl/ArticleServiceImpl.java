package com.hust.roomrental.service.impl;

import com.hust.roomrental.domain.entity.Article;
import com.hust.roomrental.domain.entity.ArticleCategory;
import com.hust.roomrental.domain.entity.ArticleTag;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.article.ArticleDetailResponse;
import com.hust.roomrental.dto.article.ArticleSummaryResponse;
import com.hust.roomrental.dto.article.ArticleUpsertRequest;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ArticleCategoryRepository;
import com.hust.roomrental.repository.ArticleRepository;
import com.hust.roomrental.repository.ArticleTagRepository;
import com.hust.roomrental.service.ArticleService;
import com.hust.roomrental.service.mapper.ArticleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleCategoryRepository articleCategoryRepository;
    private final ArticleTagRepository articleTagRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ArticleSummaryResponse> searchPublished(String categorySlug, String q, Pageable pageable) {
        Pageable safePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Article> page = articleRepository.searchPublished(
                emptyToNull(categorySlug),
                emptyToNull(q),
                safePageable
        );
        return PageResponse.from(page.map(ArticleMapper::toSummary));
    }

    @Override
    @Transactional
    public ArticleDetailResponse getPublishedBySlug(String slug) {
        Article a = articleRepository.findDetailBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "Không tìm thấy bài viết"));
        if (a.getStatus() != ArticleStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "Không tìm thấy bài viết");
        }
        a.setViewCount(a.getViewCount() + 1);
        return ArticleMapper.toDetail(a);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ArticleDetailResponse> listForAdmin(Pageable pageable) {
        Page<Article> page = articleRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc(pageable);
        return PageResponse.from(page.map(ArticleMapper::toDetail));
    }

    @Override
    @Transactional
    public ArticleDetailResponse create(User editor, ArticleUpsertRequest request) {
        assertEditor(editor);
        if (articleRepository.findBySlugAndDeletedAtIsNull(request.slug()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        }
        Article a = new Article();
        applyUpsert(editor, a, request);
        a = articleRepository.save(a);
        a = articleRepository.findDetailBySlug(a.getSlug()).orElse(a);
        return ArticleMapper.toDetail(a);
    }

    @Override
    @Transactional
    public ArticleDetailResponse update(User editor, Long id, ArticleUpsertRequest request) {
        assertEditor(editor);
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "Không tìm thấy bài"));
        if (!a.getSlug().equals(request.slug()) && articleRepository.findBySlugAndDeletedAtIsNull(request.slug()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug đã tồn tại");
        }
        applyUpsert(editor, a, request);
        a = articleRepository.save(a);
        a = articleRepository.findDetailBySlug(a.getSlug()).orElse(a);
        return ArticleMapper.toDetail(a);
    }

    @Override
    @Transactional
    public void softDelete(User editor, Long id) {
        assertEditor(editor);
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "Không tìm thấy bài"));
        a.setDeletedAt(Instant.now());
        a.setStatus(ArticleStatus.ARCHIVED);
    }

    private void assertEditor(User user) {
        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.EDITOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_EDITOR", "Không có quyền biên tập");
        }
    }

    private void applyUpsert(User editor, Article a, ArticleUpsertRequest r) {
        a.setSlug(r.slug());
        a.setTitle(r.title());
        a.setExcerpt(r.excerpt());
        a.setBody(r.body());
        a.setType(r.type());
        a.setCoverUrl(r.coverUrl());
        a.setAuthor(editor);
        a.setMetaTitle(r.metaTitle());
        a.setMetaDescription(r.metaDescription());
        if (r.categoryId() != null) {
            ArticleCategory cat = articleCategoryRepository.findById(r.categoryId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Danh mục không tồn tại"));
            a.setCategory(cat);
        } else {
            a.setCategory(null);
        }
        ArticleStatus st = r.status() != null ? r.status() : ArticleStatus.DRAFT;
        a.setStatus(st);
        if (st == ArticleStatus.PUBLISHED && a.getPublishedAt() == null) {
            a.setPublishedAt(Instant.now());
        }
        if (r.tagIds() != null && !r.tagIds().isEmpty()) {
            Set<ArticleTag> tags = new HashSet<>();
            for (Long tid : r.tagIds()) {
                tags.add(articleTagRepository.findById(tid)
                        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "TAG_NOT_FOUND", "Tag không tồn tại")));
            }
            a.setTags(tags);
        } else {
            a.setTags(new HashSet<>());
        }
    }

    private String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
