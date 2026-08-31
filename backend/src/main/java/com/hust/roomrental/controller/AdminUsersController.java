package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUsersController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role
    ) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        // Sort nằm trong native SQL (created_at); tránh Pageable sort property không khớp cột DB.
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        UserRole roleFilter = parseRoleNullable(role);
        String kw = trimToNull(keyword);
        String keywordPattern = kw == null ? null : "%" + kw + "%";
        String roleName = roleFilter == null ? null : roleFilter.name();
        Page<User> data = userRepository.searchAdminUsers(keywordPattern, roleName, pageable);
        var items = data.getContent().stream().map(this::toCompatUser).toList();

        return Map.of(
                "items", items,
                "page", safePage,
                "limit", safeLimit,
                "total", data.getTotalElements(),
                "totalPages", data.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));
        return Map.of("user", toCompatUser(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(@Valid @RequestBody AdminUserCreateRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã tồn tại");
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(trimToNull(request.fullName()))
                .phone(trimToNull(request.phone()))
                .role(parseRole(request.role()))
                .enabled(request.enabled() == null || request.enabled())
                .emailVerified(request.emailVerified() != null && request.emailVerified())
                .bonusListingSlots(0)
                .build();
        user = userRepository.save(user);
        return Map.of("user", toCompatUser(user));
    }

    @PutMapping("/{id}")
    @Transactional
    public Map<String, Object> update(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserUpdateRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã tồn tại");
        }

        user.setEmail(email);
        user.setFullName(trimToNull(request.fullName()));
        user.setPhone(trimToNull(request.phone()));
        user.setRole(parseRole(request.role()));
        if (request.enabled() != null) user.setEnabled(request.enabled());
        if (request.emailVerified() != null) user.setEmailVerified(request.emailVerified());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return Map.of("user", toCompatUser(user));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Object> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentAdmin
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        if (currentAdmin != null && user.getId().equals(currentAdmin.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OPERATION", "Không thể tự xoá tài khoản admin hiện tại");
        }

        userRepository.delete(user);
        return Map.of("ok", true);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private UserRole parseRoleNullable(String role) {
        if (role == null || role.isBlank() || "all".equalsIgnoreCase(role)) {
            return null;
        }
        return parseRole(role);
    }

    private UserRole parseRole(String role) {
        if ("admin".equalsIgnoreCase(role)) return UserRole.ADMIN;
        if ("landlord".equalsIgnoreCase(role)) return UserRole.LANDLORD;
        if ("tenant".equalsIgnoreCase(role) || "seeker".equalsIgnoreCase(role)) return UserRole.SEEKER;
        throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Vai trò không hợp lệ");
    }

    private String toCompatRole(UserRole role) {
        if (role == UserRole.ADMIN) return "admin";
        if (role == UserRole.LANDLORD) return "landlord";
        return "tenant";
    }

    private Map<String, Object> toCompatUser(User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("email", user.getEmail());
        m.put("full_name", user.getFullName());
        m.put("phone", user.getPhone());
        m.put("role", toCompatRole(user.getRole()));
        m.put("enabled", user.isEnabled());
        m.put("email_verified", user.isEmailVerified());
        m.put("avatar_url", user.getAvatarUrl());
        m.put("address", user.getAddress());
        m.put("date_of_birth", user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null);
        m.put("gender", user.getGender());
        m.put("bonus_listing_slots", user.getBonusListingSlots());
        m.put("created_at", user.getCreatedAt());
        m.put("updated_at", user.getUpdatedAt());
        return m;
    }

    public record AdminUserCreateRequest(
            @Email(message = "Email không đúng định dạng") @NotBlank(message = "Email không được để trống") String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            @Size(min = 8, max = 120, message = "Mật khẩu phải từ 8 đến 120 ký tự") String password,
            String fullName,
            String phone,
            @NotBlank(message = "Vai trò không được để trống") String role,
            Boolean enabled,
            Boolean emailVerified
    ) {
    }

    public record AdminUserUpdateRequest(
            @Email(message = "Email không đúng định dạng") @NotBlank(message = "Email không được để trống") String email,
            @Size(min = 8, max = 120, message = "Mật khẩu phải từ 8 đến 120 ký tự") String password,
            String fullName,
            String phone,
            @NotBlank(message = "Vai trò không được để trống") String role,
            Boolean enabled,
            Boolean emailVerified
    ) {
    }
}
