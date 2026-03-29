package com.hust.roomrental.service;

import com.hust.roomrental.dto.auth.AuthResponse;
import com.hust.roomrental.dto.auth.LoginRequest;
import com.hust.roomrental.dto.auth.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
