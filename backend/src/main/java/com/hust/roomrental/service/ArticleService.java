package com.hust.roomrental.service;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.article.ArticleDetailResponse;
import com.hust.roomrental.dto.article.ArticleSummaryResponse;
import com.hust.roomrental.dto.article.ArticleUpsertRequest;
import com.hust.roomrental.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ArticleService {

    PageResponse<ArticleSummaryResponse> searchPublished(String categorySlug, String q, Pageable pageable);

    ArticleDetailResponse getPublishedBySlug(String slug);

    PageResponse<ArticleDetailResponse> listForAdmin(Pageable pageable);

    ArticleDetailResponse create(User editor, ArticleUpsertRequest request);

    ArticleDetailResponse update(User editor, Long id, ArticleUpsertRequest request);

    void softDelete(User editor, Long id);
}
