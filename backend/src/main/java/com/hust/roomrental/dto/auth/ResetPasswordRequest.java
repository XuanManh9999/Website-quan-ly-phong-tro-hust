package com.hust.roomrental.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, max = 6) String otpCode,
        @NotBlank @Size(min = 8, max = 120) String newPassword
) {
}

