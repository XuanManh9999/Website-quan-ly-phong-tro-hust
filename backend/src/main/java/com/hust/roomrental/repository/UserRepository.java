package com.hust.roomrental.repository;

import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :from AND u.createdAt < :to")
    long countCreatedBetween(@Param("from") java.time.Instant from, @Param("to") java.time.Instant to);

    @Query("SELECT u.createdAt FROM User u WHERE u.createdAt >= :from AND u.createdAt < :to")
    List<Instant> findCreatedAtBetween(@Param("from") Instant from, @Param("to") Instant to);

    /**
     * PostgreSQL: dùng CAST(... AS text) + ILIKE để tránh lỗi {@code lower(bytea)} khi schema legacy
     * còn kiểu bytea, và để tìm kiếm không phân biệt hoa thường mà không gọi LOWER trên bytea.
     */
    @Query(
            value = """
                    SELECT u.* FROM app_users u
                    WHERE (:keywordPattern IS NULL
                            OR CAST(u.email AS text) ILIKE CAST(:keywordPattern AS text)
                            OR COALESCE(CAST(u.full_name AS text), '') ILIKE CAST(:keywordPattern AS text)
                            OR COALESCE(CAST(u.phone AS text), '') ILIKE CAST(:keywordPattern AS text))
                      AND (:role IS NULL OR u.role = CAST(:role AS varchar))
                    ORDER BY u.created_at DESC
                    """,
            countQuery = """
                    SELECT count(u.id) FROM app_users u
                    WHERE (:keywordPattern IS NULL
                            OR CAST(u.email AS text) ILIKE CAST(:keywordPattern AS text)
                            OR COALESCE(CAST(u.full_name AS text), '') ILIKE CAST(:keywordPattern AS text)
                            OR COALESCE(CAST(u.phone AS text), '') ILIKE CAST(:keywordPattern AS text))
                      AND (:role IS NULL OR u.role = CAST(:role AS varchar))
                    """,
            nativeQuery = true
    )
    Page<User> searchAdminUsers(
            @Param("keywordPattern") String keywordPattern,
            @Param("role") String role,
            Pageable pageable
    );
}
