package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.OtpToken;
import com.hust.roomrental.domain.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByEmailAndPurposeAndConsumedIsFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);
}
