package com.hust.roomrental.controller;

import com.hust.roomrental.config.ListingSearchCacheConfig;
import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.entity.ListingImage;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.ListingStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.common.PageResponse;
import com.hust.roomrental.dto.listing.ListingImageDto;
import com.hust.roomrental.dto.listing.ListingUpsertRequest;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.service.AdminListingService;
import com.hust.roomrental.service.ListingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
public class RoomsController {

    private final ListingService listingService;
    private final AdminListingService adminListingService;
    private final ListingRepository listingRepository;

    @GetMapping
    public Map<String, Object> listPublic(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String ward,
            @RequestParam(required = false) Double areaMin,
            @RequestParam(required = false) Double areaMax,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Long excludeId
    ) {
        int safeLimit = limit == null || limit <= 0 ? 12 : Math.min(limit, 100);
        int safeOffset = offset == null || offset < 0 ? 0 : offset;
        if (roomType != null && !roomType.isBlank() && !"phong_tro".equalsIgnoreCase(roomType)) {
            return Map.of(
                    "rooms", List.of(),
                    "total", 0,
                    "limit", safeLimit,
                    "offset", safeOffset
            );
        }
        int page = safeOffset / safeLimit;
        Pageable pageable = PageRequest.of(page, safeLimit);

        PageResponse<com.hust.roomrental.dto.listing.ListingResponse> result =
                listingService.searchPublic(
                        emptyToNull(district),
                        emptyToNull(ward),
                        emptyToNull(province),
                        emptyToNull(keyword),
                        priceMin,
                        priceMax,
                        areaMin,
                        areaMax,
                        emptyToNull(sort),
                        pageable
                );

        List<Map<String, Object>> rooms = result.content().stream()
                .filter(r -> excludeId == null || !Objects.equals(r.id(), excludeId))
                .map(this::toCompatRoomSummary)
                .toList();

        return Map.of(
                "rooms", rooms,
                "total", result.totalElements(),
                "limit", safeLimit,
                "offset", safeOffset
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> detailPublic(@PathVariable Long id) {
        var room = listingService.getPublicById(id);
        return Map.of("room", toCompatRoomDetail(room));
    }

    @GetMapping("/me/list")
    public Map<String, Object> listMine(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String keyword
    ) {
        ensureLandlordOrAdmin(user);
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "updatedAt"));
        var data = listingService.listMine(user, pageable);

        List<Map<String, Object>> filtered = data.content().stream()
                .filter(r -> keyword == null || keyword.isBlank() || containsIgnoreCase(r.title(), keyword))
                .map(this::toCompatRoomSummary)
                .toList();

        return Map.of(
                "rooms", filtered,
                "total", data.totalElements(),
                "limit", safeLimit,
                "offset", (safePage - 1) * safeLimit
        );
    }

    @GetMapping("/{id}/manage")
    public Map<String, Object> detailManage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        ensureLandlordOrAdmin(user);
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        if (!Objects.equals(listing.getOwner().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_OWNER", "Bạn không phải chủ phòng");
        }
        return Map.of("room", toCompatRoomDetail(listing));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CompatRoomUpsertRequest request
    ) {
        ensureLandlordOrAdmin(user);
        var created = listingService.create(user, toListingUpsertRequest(request));
        return Map.of("room", toCompatRoomDetail(created));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody CompatRoomUpsertRequest request
    ) {
        ensureLandlordOrAdmin(user);
        var updated = listingService.update(user, id, toListingUpsertRequest(request));
        return Map.of("room", toCompatRoomDetail(updated));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> remove(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        ensureLandlordOrAdmin(user);
        listingService.delete(user, id);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/images")
    @Transactional
    @CacheEvict(cacheNames = {ListingSearchCacheConfig.PUBLIC_LISTING_SEARCH}, allEntries = true)
    public Map<String, Object> addImage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody AddImageRequest request
    ) {
        ensureLandlordOrAdmin(user);
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        if (!Objects.equals(listing.getOwner().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_OWNER", "Bạn không phải chủ phòng");
        }
        ListingImage image = ListingImage.builder()
                .listing(listing)
                .url(request.url())
                .sortOrder(request.sortOrder() == null ? listing.getImages().size() : request.sortOrder())
                .build();
        listing.getImages().add(image);
        listing = listingRepository.save(listing);
        listing = listingRepository.findDetailById(listing.getId()).orElse(listing);
        return Map.of("room", toCompatRoomDetail(listing));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @Transactional
    @CacheEvict(cacheNames = {ListingSearchCacheConfig.PUBLIC_LISTING_SEARCH}, allEntries = true)
    public Map<String, Object> removeImage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long imageId
    ) {
        ensureLandlordOrAdmin(user);
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        if (!Objects.equals(listing.getOwner().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_OWNER", "Bạn không phải chủ phòng");
        }
        listing.getImages().removeIf(i -> Objects.equals(i.getId(), imageId) || Objects.equals((long) i.getSortOrder(), imageId));
        for (int idx = 0; idx < listing.getImages().size(); idx++) {
            listing.getImages().get(idx).setSortOrder(idx);
        }
        listing = listingRepository.save(listing);
        listing = listingRepository.findDetailById(listing.getId()).orElse(listing);
        return Map.of("room", toCompatRoomDetail(listing));
    }

    @PostMapping("/{id}/submit")
    @Transactional
    @CacheEvict(cacheNames = {ListingSearchCacheConfig.PUBLIC_LISTING_SEARCH}, allEntries = true)
    public Map<String, Object> submit(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        ensureLandlordOrAdmin(user);
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        if (!Objects.equals(listing.getOwner().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_OWNER", "Bạn không phải chủ phòng");
        }
        listing.setStatus(ListingStatus.PENDING_REVIEW);
        listing = listingRepository.save(listing);
        listing = listingRepository.findDetailById(listing.getId()).orElse(listing);
        return Map.of("room", toCompatRoomDetail(listing));
    }

    @GetMapping("/admin/list")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "updatedAt"));

        List<Listing> list;
        long total;
        if ("pending".equalsIgnoreCase(status) || status == null || status.isBlank()) {
            var pending = adminListingService.listPending(pageable);
            list = pending.content().stream()
                    .map(r -> listingRepository.findDetailById(r.id()).orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            total = pending.totalElements();
        } else {
            ListingStatus st = parseStatus(status);
            var pageData = listingRepository.findByStatus(st, pageable);
            list = pageData.getContent();
            total = pageData.getTotalElements();
        }

        List<Map<String, Object>> items = list.stream()
                .map(this::toCompatRoomDetail)
                .filter(r -> search == null || search.isBlank() || matchesRoomSearch(r, search))
                .toList();

        return Map.of(
                "items", items,
                "total", total,
                "totalPages", total == 0 ? 1 : (int) Math.ceil((double) total / safeLimit)
        );
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminDetail(@PathVariable Long id) {
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        return Map.of("room", toCompatRoomDetail(listing));
    }

    @PatchMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminApprove(@PathVariable Long id) {
        adminListingService.approve(id);
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        return Map.of("ok", true, "room", toCompatRoomDetail(listing));
    }

    @PatchMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminReject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        adminListingService.reject(id);
        Listing listing = listingRepository.findDetailById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        Map<String, Object> res = new HashMap<>();
        res.put("ok", true);
        res.put("room", toCompatRoomDetail(listing));
        res.put("reason", body != null ? body.get("reason") : null);
        return res;
    }

    private boolean matchesRoomSearch(Map<String, Object> room, String qRaw) {
        String q = qRaw.toLowerCase(Locale.ROOT);
        return contains(room.get("title"), q) || contains(room.get("landlord_email"), q) || contains(room.get("landlord_full_name"), q);
    }

    private boolean contains(Object value, String q) {
        return value != null && value.toString().toLowerCase(Locale.ROOT).contains(q);
    }

    private boolean containsIgnoreCase(String text, String q) {
        return text != null && text.toLowerCase(Locale.ROOT).contains(q.toLowerCase(Locale.ROOT));
    }

    private ListingStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return ListingStatus.PENDING_REVIEW;
        return switch (status.toLowerCase(Locale.ROOT)) {
            case "draft" -> ListingStatus.DRAFT;
            case "pending" -> ListingStatus.PENDING_REVIEW;
            case "approved" -> ListingStatus.PUBLISHED;
            case "rejected" -> ListingStatus.REJECTED;
            default -> ListingStatus.PENDING_REVIEW;
        };
    }

    private Sort parseSort(String sort) {
        if ("priceAsc".equalsIgnoreCase(sort)) return Sort.by(Sort.Direction.ASC, "price");
        if ("priceDesc".equalsIgnoreCase(sort)) return Sort.by(Sort.Direction.DESC, "price");
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private ListingUpsertRequest toListingUpsertRequest(CompatRoomUpsertRequest request) {
        String address = buildAddress(request);
        List<ListingImageDto> images = null;
        return new ListingUpsertRequest(
                request.title(),
                request.description(),
                request.price_monthly(),
                request.area_m2(),
                address,
                request.district(),
                null,
                null,
                request.max_occupants(),
                normalizeGenderPolicy(request.gender_policy()),
                request.deposit(),
                request.map_embed_html(),
                normalizeUtilitiesJson(request.utilities_json()),
                true,
                images
        );
    }

    private String normalizeGenderPolicy(String v) {
        if (v == null || v.isBlank()) return "any";
        String s = v.trim().toLowerCase(Locale.ROOT);
        if ("male".equals(s) || "female".equals(s) || "any".equals(s)) return s;
        return "any";
    }

    private String normalizeUtilitiesJson(Object utilities) {
        if (utilities == null) return "{}";
        try {
            if (utilities instanceof String s) {
                String t = s.trim();
                return t.isBlank() ? "{}" : t;
            }
            // best-effort serialize Map/Object to JSON string
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(utilities);
        } catch (Exception ignored) {
            return "{}";
        }
    }

    private String buildAddress(CompatRoomUpsertRequest request) {
        List<String> parts = new ArrayList<>();
        if (request.street() != null && !request.street().isBlank()) parts.add(request.street().trim());
        if (request.ward() != null && !request.ward().isBlank()) parts.add(request.ward().trim());
        if (request.district() != null && !request.district().isBlank()) parts.add(request.district().trim());
        if (request.province() != null && !request.province().isBlank()) parts.add(request.province().trim());
        if (request.address_detail() != null && !request.address_detail().isBlank()) parts.add(request.address_detail().trim());
        return String.join(", ", parts);
    }

    private Map<String, Object> toCompatRoomSummary(com.hust.roomrental.dto.listing.ListingResponse r) {
        Map<String, Object> m = new HashMap<>();
        AddressParts addr = splitAddress(r.address());
        m.put("id", r.id());
        m.put("title", r.title());
        m.put("status", toCompatStatus(r.status()));
        m.put("price_monthly", r.price());
        m.put("area_m2", r.areaM2());
        m.put("district", r.district() != null && !r.district().isBlank() ? r.district() : addr.district());
        m.put("street", addr.street());
        m.put("province", addr.province());
        m.put("ward", addr.ward());
        m.put("address_detail", addr.detail());
        m.put("cover_image_url", (r.images() != null && !r.images().isEmpty()) ? r.images().get(0).url() : null);
        m.put("room_type", "phong_tro");
        m.put("max_occupants", r.maxOccupants());
        m.put("gender_policy", r.genderPolicy() != null ? r.genderPolicy() : "any");
        m.put("deposit", r.deposit());
        m.put("landlord_full_name", r.ownerName());
        m.put("landlord_name", r.ownerName());
        m.put("landlord_email", r.ownerEmail());
        m.put("landlord_phone", r.ownerPhone());
        m.put("rejection_reason", null);
        return m;
    }

    private AddressParts splitAddress(String address) {
        if (address == null || address.isBlank()) {
            return new AddressParts(null, null, null, null, null);
        }
        List<String> parts = Arrays.stream(address.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
        if (parts.isEmpty()) return new AddressParts(null, null, null, null, null);

        String province = parts.size() >= 1 ? parts.get(parts.size() - 1) : null;
        String district = parts.size() >= 2 ? parts.get(parts.size() - 2) : null;
        String ward = parts.size() >= 3 ? parts.get(parts.size() - 3) : null;
        String street = parts.size() >= 4 ? String.join(", ", parts.subList(0, parts.size() - 3)) : parts.get(0);
        String detail = null;
        return new AddressParts(street, ward, district, province, detail);
    }

    private record AddressParts(String street, String ward, String district, String province, String detail) {}

    private Map<String, Object> toCompatRoomDetail(com.hust.roomrental.dto.listing.ListingResponse r) {
        Map<String, Object> m = toCompatRoomSummary(r);
        List<Map<String, Object>> images = (r.images() == null ? List.<ListingImageDto>of() : r.images()).stream()
                .map(i -> Map.of(
                        "id", i.id() != null ? (Object) i.id() : (Object) i.sortOrder(),
                        "url", i.url(),
                        "sort_order", i.sortOrder()
                ))
                .toList();
        m.put("description", r.description());
        m.put("images", images);
        m.put("published_at", r.publishedAt());
        m.put("map_embed_html", r.mapEmbedHtml());
        m.put("utilities_json", r.utilitiesJson() == null || r.utilitiesJson().isBlank() ? "{}" : r.utilitiesJson());
        return m;
    }

    private Map<String, Object> toCompatRoomDetail(Listing listing) {
        var dto = com.hust.roomrental.service.mapper.ListingMapper.toResponse(listing);
        Map<String, Object> m = toCompatRoomDetail(dto);
        m.put("landlord_email", listing.getOwner() != null ? listing.getOwner().getEmail() : null);
        m.put("landlord_phone", listing.getOwner() != null ? listing.getOwner().getPhone() : null);
        return m;
    }

    private String toCompatStatus(ListingStatus status) {
        return switch (status) {
            case DRAFT -> "draft";
            case PENDING_REVIEW -> "pending";
            case PUBLISHED -> "approved";
            case REJECTED -> "rejected";
            case EXPIRED, HIDDEN -> "draft";
        };
    }

    private void ensureLandlordOrAdmin(User user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        if (user.getRole() != UserRole.LANDLORD && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thao tác");
        }
    }

    private String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    public record CompatRoomUpsertRequest(
            @NotBlank String title,
            String description,
            String room_type,
            String province,
            String district,
            String ward,
            String street,
            String address_detail,
            @NotNull @Min(0) BigDecimal price_monthly,
            @NotNull @Min(1) Double area_m2,
            Integer max_occupants,
            String gender_policy,
            BigDecimal deposit,
            String map_embed_html,
            Object utilities_json
    ) {}

    public record AddImageRequest(@NotBlank String url, Integer sortOrder) {}
}
