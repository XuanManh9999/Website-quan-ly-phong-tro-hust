package com.hust.roomrental.dto.auth;

import com.hust.roomrental.domain.enums.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OtpSendRequest(
        @NotBlank @Email String email,
        @NotNull OtpPurpose purpose
) {
}
