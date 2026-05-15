package com.hust.roomrental.dto.auth;

import com.hust.roomrental.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng") String email,
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 100, message = "Mật khẩu phải từ 8 đến 100 ký tự") String password,
        @Size(max = 200, message = "Họ tên không được vượt quá 200 ký tự") String fullName,
        @Size(max = 32, message = "Số điện thoại không được vượt quá 32 ký tự") String phone,
        @NotNull(message = "Vai trò không được để trống") UserRole role
) {
}
