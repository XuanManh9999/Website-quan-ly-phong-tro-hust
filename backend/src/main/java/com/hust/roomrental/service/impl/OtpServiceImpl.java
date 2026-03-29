package com.hust.roomrental.service.impl;

import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.domain.entity.OtpToken;
import com.hust.roomrental.domain.enums.OtpPurpose;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.repository.OtpTokenRepository;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.EmailNotificationService;
import com.hust.roomrental.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final int OTP_LENGTH = 6;
    private static final int TTL_MINUTES = 10;

    private final OtpTokenRepository otpTokenRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;
    private final AppProperties appProperties;
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public void sendOtp(String email, OtpPurpose purpose) {
        if (purpose == OtpPurpose.REGISTER && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã được đăng ký");
        }
        String code = generateNumericOtp();
        String hash = hashCode(code);
        Instant exp = Instant.now().plus(TTL_MINUTES, ChronoUnit.MINUTES);
        OtpToken token = OtpToken.builder()
                .email(email.toLowerCase())
                .codeHash(hash)
                .purpose(purpose)
                .expiresAt(exp)
                .consumed(false)
                .build();
        otpTokenRepository.save(token);
        emailNotificationService.sendOtpEmail(email, code);
    }

    @Override
    @Transactional
    public void verifyOtp(String email, String code, OtpPurpose purpose) {
        OtpToken token = otpTokenRepository
                .findTopByEmailAndPurposeAndConsumedIsFalseOrderByCreatedAtDesc(email.toLowerCase(), purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_NOT_FOUND", "Không có mã OTP hợp lệ"));
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "Mã OTP đã hết hạn");
        }
        if (!token.getCodeHash().equals(hashCode(code))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Mã OTP không đúng");
        }
        token.setConsumed(true);
    }

    private String generateNumericOtp() {
        int n = random.nextInt(1_000_000);
        return String.format("%06d", n);
    }

    private String hashCode(String code) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            String pepper = appProperties.getJwt().getSecret();
            byte[] digest = sha.digest((code + pepper).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
