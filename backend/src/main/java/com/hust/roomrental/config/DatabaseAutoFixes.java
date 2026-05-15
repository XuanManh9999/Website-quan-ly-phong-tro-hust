package com.hust.roomrental.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Tự động vá một số lỗi schema do migrate/ddl-auto để lại.
 *
 * Hiện tại xử lý case PostgreSQL: cột String bị tạo nhầm kiểu bytea khiến query LOWER(...) lỗi.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class DatabaseAutoFixes implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        tryFixListingsTextColumns();
        tryFixArticlesTextColumns();
        tryFixUsersTextColumns();
        tryFixOrphanPaymentOrders();
    }

    private void tryFixListingsTextColumns() {
        if (!isPostgres()) return;

        // Các cột String quan trọng hay được search bằng lower(...)
        fixByteaToText("listings", "title", "varchar(255)");
        fixByteaToText("listings", "address", "varchar(500)");
        fixByteaToText("listings", "district", "varchar(120)");
    }

    private void tryFixArticlesTextColumns() {
        if (!isPostgres()) return;

        fixByteaToText("articles", "slug", "varchar(200)");
        fixByteaToText("articles", "title", "varchar(255)");
        fixByteaToText("articles", "excerpt", "varchar(500)");
    }

    private void tryFixUsersTextColumns() {
        if (!isPostgres()) return;

        fixByteaToText("app_users", "email", "varchar(255)");
        fixByteaToText("app_users", "full_name", "varchar(255)");
        fixByteaToText("app_users", "phone", "varchar(40)");
    }

    /**
     * Dọn dữ liệu legacy: payment_orders.package_id trỏ tới subscription_packages đã bị xoá.
     * Vì package_id NOT NULL, giải pháp an toàn là chuyển về gói "basic" (nếu có).
     */
    private void tryFixOrphanPaymentOrders() {
        if (!isPostgres()) return;
        try {
            Long basicId = jdbcTemplate.queryForObject(
                    "SELECT id FROM subscription_packages WHERE code = 'basic' LIMIT 1",
                    Long.class
            );
            if (basicId == null) {
                log.warn("DB autofix: không tìm thấy subscription_packages.code='basic', bỏ qua dọn payment_orders mồ côi");
                return;
            }

            Long orphans = jdbcTemplate.queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM payment_orders po
                            LEFT JOIN subscription_packages sp ON sp.id = po.package_id
                            WHERE sp.id IS NULL
                            """,
                    Long.class
            );
            if (orphans == null || orphans <= 0) return;

            int updated = jdbcTemplate.update(
                    """
                            UPDATE payment_orders po
                            SET package_id = ?
                            WHERE po.package_id IS NULL
                               OR NOT EXISTS (SELECT 1 FROM subscription_packages sp WHERE sp.id = po.package_id)
                            """,
                    basicId
            );
            log.warn("DB autofix: đã dọn {} payment_orders mồ côi (package_id -> basic id={})", updated, basicId);
        } catch (Exception e) {
            log.warn("DB autofix: không thể dọn payment_orders mồ côi: {}", e.getMessage());
        }
    }

    private void fixByteaToText(String table, String column, String targetType) {
        try {
            String type = pgTypeOf(table, column);
            if (type == null) {
                log.warn("DB autofix: không tìm thấy cột {}.{}", table, column);
                return;
            }
            if (!"bytea".equalsIgnoreCase(type.trim())) return;

            // Nếu dữ liệu đang là bytea nhưng thực chất là UTF-8 bytes, convert_from sẽ trả về text.
            // Sau đó cast về varchar(n) theo targetType.
            String sql1 = "ALTER TABLE " + table + " ALTER COLUMN " + column
                    + " TYPE " + targetType
                    + " USING convert_from(" + column + ", 'UTF8')";
            try {
                jdbcTemplate.execute(sql1);
                log.warn("DB autofix: đã chuyển {}.{} từ bytea -> {}", table, column, targetType);
                return;
            } catch (Exception e) {
                log.warn("DB autofix: convert_from thất bại cho {}.{} ({}). Thử phương án fallback.",
                        table, column, e.getMessage());
            }

            // Fallback: encode(bytea,'escape') -> text (mất một số ký tự đặc biệt nếu dữ liệu không phải UTF8 chuẩn,
            // nhưng giúp hệ thống chạy được để test/dev).
            String sql2 = "ALTER TABLE " + table + " ALTER COLUMN " + column
                    + " TYPE " + targetType
                    + " USING encode(" + column + ", 'escape')";
            jdbcTemplate.execute(sql2);
            log.warn("DB autofix: đã chuyển {}.{} từ bytea -> {} bằng encode('escape')", table, column, targetType);
        } catch (Exception e) {
            // Không chặn app khởi động nếu không thể tự vá (vd: quyền hạn DB).
            log.warn("DB autofix: không thể tự vá {}.{}: {}", table, column, e.getMessage());
        }
    }

    private String pgTypeOf(String table, String column) {
        try {
            return jdbcTemplate.queryForObject(
                    """
                            SELECT t.typname
                            FROM pg_attribute a
                            JOIN pg_class c ON c.oid = a.attrelid
                            JOIN pg_type t ON t.oid = a.atttypid
                            JOIN pg_namespace n ON n.oid = c.relnamespace
                            WHERE n.nspname = 'public'
                              AND c.relname = ?
                              AND a.attname = ?
                              AND a.attnum > 0
                              AND NOT a.attisdropped
                            """,
                    String.class,
                    table,
                    column
            );
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isPostgres() {
        try {
            String product = jdbcTemplate.queryForObject("SELECT version()", String.class);
            if (product == null) return false;
            String p = product.toLowerCase();
            return p.contains("postgresql");
        } catch (Exception ignored) {
            return false;
        }
    }
}

