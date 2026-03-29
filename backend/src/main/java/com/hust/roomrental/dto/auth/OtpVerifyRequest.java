package com.hust.roomrental.dto.auth;

import com.hust.roomrental.domain.enums.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OtpVerifyRequest(
        @Email String email,
        @NotBlank @Size(min = 4, max = 12) String code,
        @NotNull OtpPurpose purpose
) {
}
