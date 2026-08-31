package com.hust.roomrental.dto.auth;

import com.hust.roomrental.domain.enums.UserRole;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInMs,
        UserInfo user
) {
    public record UserInfo(Long id, String email, String fullName, String phone, UserRole role, boolean emailVerified) {
        public UserInfo(Long id, String email, String fullName, UserRole role, boolean emailVerified) {
            this(id, email, fullName, null, role, emailVerified);
        }
    }
}
