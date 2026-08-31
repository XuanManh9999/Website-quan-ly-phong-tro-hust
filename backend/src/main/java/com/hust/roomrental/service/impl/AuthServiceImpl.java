package com.hust.roomrental.service.impl;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.auth.AuthResponse;
import com.hust.roomrental.dto.auth.LoginRequest;
import com.hust.roomrental.dto.auth.RegisterRequest;
import com.hust.roomrental.dto.auth.ResetPasswordRequest;
import com.hust.roomrental.dto.auth.VerifyEmailRequest;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.domain.enums.OtpPurpose;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.security.JwtTokenProvider;
import com.hust.roomrental.service.AuthService;
import com.hust.roomrental.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AppProperties appProperties;
    private final OtpService otpService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() == UserRole.ADMIN || request.role() == UserRole.EDITOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ROLE_NOT_ALLOWED", "Không thể tự đăng ký vai trò này");
        }
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã tồn tại");
        }
        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(request.role())
                .enabled(true)
                .emailVerified(false)
                .bonusListingSlots(0)
                .build();
        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));
        User user = (User) auth.getPrincipal();
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.email().toLowerCase();
        otpService.verifyOtp(email, request.otpCode(), OtpPurpose.RESET_PASSWORD);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Override
    @Transactional
    public void verifyEmail(User user, VerifyEmailRequest request) {
        otpService.verifyOtp(user.getEmail(), request.otpCode(), OtpPurpose.VERIFY_EMAIL);
        user.setEmailVerified(true);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtTokenProvider.generateAccessToken(user);
        var u = new AuthResponse.UserInfo(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified()
        );
        return new AuthResponse(token, "Bearer", appProperties.getJwt().getExpirationMs(), u);
    }
}
