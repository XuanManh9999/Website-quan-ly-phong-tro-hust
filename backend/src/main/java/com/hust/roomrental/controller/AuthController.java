package com.hust.roomrental.controller;

import com.hust.roomrental.dto.auth.*;
import com.hust.roomrental.service.AuthService;
import com.hust.roomrental.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/otp/send")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendOtp(@Valid @RequestBody OtpSendRequest request) {
        otpService.sendOtp(request.email(), request.purpose());
    }

    @PostMapping("/otp/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        otpService.verifyOtp(request.email(), request.code(), request.purpose());
    }
}
