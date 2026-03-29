package com.hust.roomrental.dto.auth;

import com.hust.roomrental.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @Size(max = 200) String fullName,
        @Size(max = 32) String phone,
        @NotNull UserRole role
) {
}
