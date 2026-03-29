package com.hust.roomrental.service;

import com.hust.roomrental.domain.enums.OtpPurpose;

public interface OtpService {

    void sendOtp(String email, OtpPurpose purpose);

    void verifyOtp(String email, String code, OtpPurpose purpose);
}
