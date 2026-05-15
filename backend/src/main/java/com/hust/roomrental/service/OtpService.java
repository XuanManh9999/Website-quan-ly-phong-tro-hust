package com.hust.roomrental.service;

import com.hust.roomrental.domain.enums.OtpPurpose;

public interface OtpService {

    void sendOtp(String email, OtpPurpose purpose);

    /**
     * Chỉ kiểm tra OTP hợp lệ (không đánh dấu consumed).
     * Dùng cho flow nhiều bước: verify trước, thao tác sau.
     */
    void checkOtp(String email, String code, OtpPurpose purpose);

    /**
     * Kiểm tra OTP hợp lệ và đánh dấu consumed.
     * Dùng cho thao tác cuối (reset password/verify email...).
     */
    void verifyOtp(String email, String code, OtpPurpose purpose);
}
