package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.dto.article.ArticleDetailResponse;
import com.hust.roomrental.dto.article.ArticleUpsertRequest;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/articles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
public class AdminArticleController {

    private final ArticleService articleService;

    @GetMapping
    public PageResponse<ArticleDetailResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return articleService.listForAdmin(pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ArticleDetailResponse create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ArticleUpsertRequest request
    ) {
        return articleService.create(user, request);
    }

    @PutMapping("/{id}")
    public ArticleDetailResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ArticleUpsertRequest request
    ) {
        return articleService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        articleService.softDelete(user, id);
    }
}
