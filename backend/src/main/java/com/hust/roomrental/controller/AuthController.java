package com.hust.roomrental.controller;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.OtpPurpose;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.auth.AuthResponse;
import com.hust.roomrental.dto.auth.LoginRequest;
import com.hust.roomrental.dto.auth.RegisterRequest;
import com.hust.roomrental.dto.auth.ResetPasswordRequest;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.AuthService;
import com.hust.roomrental.service.OtpService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@Valid @RequestBody CompatRegisterRequest request) {
        AuthResponse response = authService.register(new RegisterRequest(
                request.email(),
                request.password(),
                request.fullName(),
                null,
                mapRole(request.role())
        ));
        return toCompatAuthResponse(response);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return toCompatAuthResponse(response);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        User freshUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));
        return Map.of("user", toCompatUser(freshUser));
    }

    @PutMapping("/me")
    @Transactional
    public Map<String, Object> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CompatUpdateProfileRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        User current = userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        current.setFullName(request.fullName());
        current.setPhone(request.phone());

        return Map.of("user", toCompatUser(current));
    }

    @PutMapping("/change-password")
    @Transactional
    public Map<String, Object> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CompatChangePasswordRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn chưa đăng nhập");
        }
        User current = userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(request.currentPassword(), current.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD", "Mật khẩu hiện tại không đúng");
        }
        current.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return Map.of("user", toCompatUser(current));
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@Valid @RequestBody CompatForgotPasswordRequest request) {
        otpService.sendOtp(request.email().toLowerCase(), OtpPurpose.RESET_PASSWORD);
        return Map.of("ok", true);
    }

    @PostMapping("/verify-reset-otp")
    public Map<String, Object> verifyResetOtp(@Valid @RequestBody CompatVerifyResetOtpRequest request) {
        otpService.checkOtp(request.email().toLowerCase(), request.otp(), OtpPurpose.RESET_PASSWORD);
        return Map.of("ok", true);
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@Valid @RequestBody CompatResetPasswordRequest request) {
        authService.resetPassword(new ResetPasswordRequest(
                request.email().toLowerCase(),
                request.otp(),
                request.newPassword()
        ));
        return Map.of("ok", true);
    }

    private Map<String, Object> toCompatAuthResponse(AuthResponse response) {
        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", response.accessToken());
        data.put("user", toCompatUser(response.user()));
        return data;
    }

    private Map<String, Object> toCompatUser(AuthResponse.UserInfo user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.id());
        m.put("email", user.email());
        m.put("full_name", user.fullName());
        m.put("role", toCompatRole(user.role()));
        m.put("email_verified", user.emailVerified());
        m.put("phone", null);
        m.put("address", null);
        m.put("date_of_birth", null);
        m.put("gender", null);
        m.put("avatar_url", null);
        return m;
    }

    private Map<String, Object> toCompatUser(User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("email", user.getEmail());
        m.put("full_name", user.getFullName());
        m.put("role", toCompatRole(user.getRole()));
        m.put("email_verified", user.isEmailVerified());
        m.put("phone", user.getPhone());
        m.put("address", null);
        m.put("date_of_birth", null);
        m.put("gender", null);
        m.put("avatar_url", null);
        return m;
    }

    private UserRole mapRole(String role) {
        if ("landlord".equalsIgnoreCase(role)) return UserRole.LANDLORD;
        if ("tenant".equalsIgnoreCase(role) || role == null || role.isBlank()) return UserRole.SEEKER;
        throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Vai trò không hợp lệ");
    }

    private String toCompatRole(UserRole role) {
        if (role == UserRole.LANDLORD) return "landlord";
        if (role == UserRole.ADMIN) return "admin";
        return "tenant";
    }

    public record CompatRegisterRequest(
            @Email(message = "Email không đúng định dạng") @NotBlank(message = "Email không được để trống") String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            @Size(min = 8, max = 120, message = "Mật khẩu phải từ 8 đến 120 ký tự") String password,
            String fullName,
            String role
    ) {}

    public record CompatForgotPasswordRequest(
            @Email(message = "Email không đúng định dạng") @NotBlank(message = "Email không được để trống") String email
    ) {}

    public record CompatVerifyResetOtpRequest(
            @Email(message = "Email không đúng định dạng") @NotBlank(message = "Email không được để trống") String email,
            @NotBlank(message = "OTP không được để trống")
            @Size(min = 6, max = 6, message = "OTP phải gồm 6 chữ số") String otp
    ) {}

    public record CompatResetPasswordRequest(
            @Email(message = "Email không đúng định dạng") @NotBlank(message = "Email không được để trống") String email,
            @NotBlank(message = "OTP không được để trống")
            @Size(min = 6, max = 6, message = "OTP phải gồm 6 chữ số") String otp,
            @NotBlank(message = "Mật khẩu mới không được để trống")
            @Size(min = 8, max = 120, message = "Mật khẩu mới phải từ 8 đến 120 ký tự") String newPassword
    ) {}

    public record CompatUpdateProfileRequest(
            String fullName,
            String phone,
            String address,
            String dateOfBirth,
            String gender,
            String avatarUrl
    ) {}

    public record CompatChangePasswordRequest(
            @NotBlank(message = "Mật khẩu hiện tại không được để trống")
            @Size(min = 6, max = 120, message = "Mật khẩu hiện tại phải từ 6 đến 120 ký tự") String currentPassword,
            @NotBlank(message = "Mật khẩu mới không được để trống")
            @Size(min = 8, max = 120, message = "Mật khẩu mới phải từ 8 đến 120 ký tự") String newPassword
    ) {}
}
