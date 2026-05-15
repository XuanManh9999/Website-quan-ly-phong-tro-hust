package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.FaqItem;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.FaqItemRepository;
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
@RequestMapping("/faqs")
public class FaqsController {

    private final FaqItemRepository faqItemRepository;

    @GetMapping
    public Map<String, Object> listPublic() {
        List<Map<String, Object>> items = faqItemRepository.findByActiveIsTrueOrderBySortOrderAscUpdatedAtDesc().stream()
                .map(this::toPublic)
                .toList();
        return Map.of("items", items);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminList() {
        List<Map<String, Object>> items = faqItemRepository.findAllByOrderBySortOrderAscUpdatedAtDesc().stream()
                .map(this::toAdmin)
                .toList();
        return Map.of("items", items);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> adminCreate(@Valid @RequestBody UpsertFaqRequest req) {
        FaqItem f = FaqItem.builder()
                .question(req.question().trim())
                .answerHtml(req.answerHtml())
                .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder())
                .active(Boolean.TRUE.equals(req.active()))
                .build();
        f = faqItemRepository.save(f);
        return Map.of("item", toAdmin(f));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminUpdate(@PathVariable Long id, @Valid @RequestBody UpsertFaqRequest req) {
        FaqItem f = faqItemRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FAQ_NOT_FOUND", "Không tìm thấy FAQ"));
        f.setQuestion(req.question().trim());
        f.setAnswerHtml(req.answerHtml());
        f.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        f.setActive(Boolean.TRUE.equals(req.active()));
        f = faqItemRepository.save(f);
        return Map.of("item", toAdmin(f));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminDelete(@PathVariable Long id) {
        if (!faqItemRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "FAQ_NOT_FOUND", "Không tìm thấy FAQ");
        }
        faqItemRepository.deleteById(id);
        return Map.of("ok", true);
    }

    private Map<String, Object> toPublic(FaqItem f) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", f.getId());
        m.put("question", f.getQuestion());
        m.put("answer_html", f.getAnswerHtml());
        return m;
    }

    private Map<String, Object> toAdmin(FaqItem f) {
        Map<String, Object> m = toPublic(f);
        m.put("active", f.isActive());
        m.put("sort_order", f.getSortOrder());
        m.put("created_at", f.getCreatedAt());
        m.put("updated_at", f.getUpdatedAt());
        return m;
    }

    public record UpsertFaqRequest(
            @NotBlank @Size(max = 300) String question,
            String answerHtml,
            Integer sortOrder,
            Boolean active
    ) {}
}

