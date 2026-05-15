package com.hust.roomrental.service;

import com.hust.roomrental.dto.auth.AuthResponse;
import com.hust.roomrental.dto.auth.LoginRequest;
import com.hust.roomrental.dto.auth.RegisterRequest;
import com.hust.roomrental.dto.auth.ResetPasswordRequest;
import com.hust.roomrental.dto.auth.VerifyEmailRequest;
import com.hust.roomrental.domain.entity.User;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void resetPassword(ResetPasswordRequest request);

    void verifyEmail(User user, VerifyEmailRequest request);
}
