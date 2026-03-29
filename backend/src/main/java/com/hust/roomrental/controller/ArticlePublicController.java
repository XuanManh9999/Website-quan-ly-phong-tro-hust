package com.hust.roomrental.controller;

import com.hust.roomrental.dto.article.ArticleDetailResponse;
import com.hust.roomrental.dto.article.ArticleSummaryResponse;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticlePublicController {

    private final ArticleService articleService;

    @GetMapping
    public PageResponse<ArticleSummaryResponse> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"));
        return articleService.searchPublished(category, q, pageable);
    }

    @GetMapping("/{slug}")
    public ArticleDetailResponse getBySlug(@PathVariable String slug) {
        return articleService.getPublishedBySlug(slug);
    }
}
