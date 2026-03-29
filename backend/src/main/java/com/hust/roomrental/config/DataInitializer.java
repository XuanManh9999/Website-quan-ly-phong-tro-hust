package com.hust.roomrental.config;

import com.hust.roomrental.domain.entity.ArticleCategory;
import com.hust.roomrental.domain.entity.SubscriptionPackage;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.repository.ArticleCategoryRepository;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import com.hust.roomrental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final ArticleCategoryRepository articleCategoryRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmail("admin@hust.local").isEmpty()) {
            User admin = User.builder()
                    .email("admin@hust.local")
                    .passwordHash(passwordEncoder.encode("Admin@123456"))
                    .fullName("Quản trị HUST")
                    .role(UserRole.ADMIN)
                    .enabled(true)
                    .emailVerified(true)
                    .bonusListingSlots(0)
                    .build();
            userRepository.save(admin);
        }
        if (subscriptionPackageRepository.findByCodeAndActiveIsTrue("EXTRA_5").isEmpty()) {
            subscriptionPackageRepository.save(SubscriptionPackage.builder()
                    .code("EXTRA_5")
                    .name("Thêm 5 tin / tháng")
                    .description("Gói mở rộng quota đăng tin")
                    .priceVnd(new BigDecimal("99000"))
                    .extraListingsPerMonth(5)
                    .priorityDays(null)
                    .active(true)
                    .build());
        }
        if (subscriptionPackageRepository.findByCodeAndActiveIsTrue("PRIORITY_7").isEmpty()) {
            subscriptionPackageRepository.save(SubscriptionPackage.builder()
                    .code("PRIORITY_7")
                    .name("Ưu tiên hiển thị 7 ngày")
                    .description("Ưu tiên (placeholder nghiệp vụ)")
                    .priceVnd(new BigDecimal("49000"))
                    .extraListingsPerMonth(0)
                    .priorityDays(7)
                    .active(true)
                    .build());
        }
        if (articleCategoryRepository.findBySlug("tin-tuc").isEmpty()) {
            articleCategoryRepository.save(ArticleCategory.builder()
                    .name("Tin tức")
                    .slug("tin-tuc")
                    .parent(null)
                    .sortOrder(0)
                    .build());
        }
    }
}
