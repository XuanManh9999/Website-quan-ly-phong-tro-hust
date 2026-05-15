package com.hust.roomrental.config;

import com.hust.roomrental.domain.entity.Article;
import com.hust.roomrental.domain.entity.ArticleCategory;
import com.hust.roomrental.domain.entity.DiscountCoupon;
import com.hust.roomrental.domain.entity.FaqItem;
import com.hust.roomrental.domain.entity.Listing;
import com.hust.roomrental.domain.entity.ListingImage;
import com.hust.roomrental.domain.entity.PaymentOrder;
import com.hust.roomrental.domain.entity.StaticPage;
import com.hust.roomrental.domain.entity.SubscriptionPackage;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.ArticleStatus;
import com.hust.roomrental.domain.enums.ArticleType;
import com.hust.roomrental.domain.enums.ListingStatus;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.repository.ArticleRepository;
import com.hust.roomrental.repository.ArticleCategoryRepository;
import com.hust.roomrental.repository.DiscountCouponRepository;
import com.hust.roomrental.repository.FaqItemRepository;
import com.hust.roomrental.repository.ListingImageRepository;
import com.hust.roomrental.repository.ListingRepository;
import com.hust.roomrental.repository.PaymentOrderRepository;
import com.hust.roomrental.repository.StaticPageRepository;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import com.hust.roomrental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final ArticleCategoryRepository articleCategoryRepository;
    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final ArticleRepository articleRepository;
    private final DiscountCouponRepository discountCouponRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final StaticPageRepository staticPageRepository;
    private final FaqItemRepository faqItemRepository;

    @Override
    public void run(ApplicationArguments args) {
        User adminHust = upsertUser("admin@hust.local", "Admin@123456", "Quản trị HUST", "0901000001", UserRole.ADMIN);
        User admin = upsertUser("admin@example.com", "Admin123!", "Admin hệ thống", "0901000002", UserRole.ADMIN);
        User landlord1 = upsertUser("landlord@example.com", "Landlord123!", "Nguyễn Văn An", "0912001001", UserRole.LANDLORD);
        User landlord2 = upsertUser("landlord2@example.com", "Landlord123!", "Trần Thị Bình", "0912001002", UserRole.LANDLORD);
        User landlord3 = upsertUser("landlord3@example.com", "Landlord123!", "Lê Quốc Cường", "0912001003", UserRole.LANDLORD);
        User landlord4 = upsertUser("landlord4@example.com", "Landlord123!", "Phạm Minh Dũng", "0912001004", UserRole.LANDLORD);
        User landlord5 = upsertUser("landlord5@example.com", "Landlord123!", "Vũ Khánh Linh", "0912001005", UserRole.LANDLORD);
        User landlord6 = upsertUser("landlord6@example.com", "Landlord123!", "Đỗ Hoài Nam", "0912001006", UserRole.LANDLORD);
        User tenant1 = upsertUser("tenant@example.com", "Tenant123!", "Người thuê B", "0938002001", UserRole.SEEKER);
        upsertUser("tenant2@example.com", "Tenant123!", "Người thuê C", "0938002002", UserRole.SEEKER);
        upsertUser("tenant3@example.com", "Tenant123!", "Người thuê D", "0938002003", UserRole.SEEKER);
        upsertUser("tenant4@example.com", "Tenant123!", "Người thuê E", "0938002004", UserRole.SEEKER);
        upsertUser("tenant5@example.com", "Tenant123!", "Người thuê F", "0938002005", UserRole.SEEKER);
        upsertUser("tenant6@example.com", "Tenant123!", "Người thuê G", "0938002006", UserRole.SEEKER);

        SubscriptionPackage basic = upsertPackage("basic", "Basic", "Gói mặc định miễn phí", BigDecimal.ZERO, 0, null, true);
        SubscriptionPackage pro = upsertPackage("pro", "Pro", "Nâng quota đăng tin", new BigDecimal("30000"), 25, null, true);
        SubscriptionPackage proPlus = upsertPackage("pro_plus", "Pro+", "Gói cao cấp cho chủ trọ", new BigDecimal("100000"), 95, null, true);

        upsertCoupon("DEMO10", "percent", 10, 50000L, null, 200, 2, LocalDate.now(), LocalDate.now().plusYears(1), true,
                "Demo: giảm 10% (tối đa 50k) mọi gói trả phí");
        upsertCoupon("GIAM20K", "fixed", 20000, null, "[\"pro\",\"pro_plus\"]", null, 1, null, null, true,
                "Demo: giảm 20.000đ cho gói Pro / Pro+");
        upsertCoupon("SINHVIEN15", "percent", 15, 75000L, "[\"pro\",\"pro_plus\"]", 500, 1,
                LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6), true,
                "Ưu đãi sinh viên: giảm 15% cho gói Pro/Pro+");
        upsertCoupon("THANGMOI30K", "fixed", 30000, null, "[\"pro_plus\"]", 200, 1,
                LocalDate.now().minusDays(5), LocalDate.now().plusMonths(3), true,
                "Tháng mới: giảm 30.000đ cho gói Pro+");

        ArticleCategory cateExp = upsertCategory("kinh-nghiem-thue-tro", "Kinh nghiệm thuê trọ", 0);
        ArticleCategory cateSaving = upsertCategory("meo-tiet-kiem-chi-phi", "Mẹo tiết kiệm chi phí", 1);
        ArticleCategory cateNews = upsertCategory("tin-tuc", "Tin tức", 2);
        ArticleCategory cateLaw = upsertCategory("phap-ly-nha-tro", "Pháp lý nhà trọ", 3);
        ArticleCategory cateLiving = upsertCategory("song-thong-minh", "Sống thông minh", 4);

        upsertArticle(
                "5-luu-y-quan-trong-khi-thue-phong-tro",
                "5 lưu ý quan trọng khi thuê phòng trọ",
                "Những lưu ý cơ bản để tránh rủi ro khi tìm phòng trọ.",
                "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg",
                "<h2>1. Khảo sát khu vực</h2><p>Kiểm tra an ninh, môi trường xung quanh, hàng xóm...</p>",
                admin,
                cateExp
        );
        upsertArticle(
                "cach-thuong-luong-gia-thue-hieu-qua-voi-chu-tro",
                "Cách thương lượng giá thuê hiệu quả với chủ trọ",
                "Một vài gợi ý để đàm phán giá thuê tốt hơn mà vẫn giữ được thiện cảm.",
                "https://images.pexels.com/photos/8293776/pexels-photo-8293776.jpeg",
                "<p>Trước khi thương lượng, hãy tìm hiểu mặt bằng giá khu vực, chuẩn bị lý do hợp lý và luôn giữ thái độ tôn trọng.</p>",
                adminHust,
                cateExp
        );
        upsertArticle(
                "kinh-nghiem-kiem-tra-hop-dong-thue-nha-chi-tiet",
                "Kinh nghiệm kiểm tra hợp đồng thuê nhà chi tiết",
                "Checklist các điều khoản quan trọng để tránh tranh chấp về sau.",
                "https://images.pexels.com/photos/5668481/pexels-photo-5668481.jpeg",
                "<h2>Các điều khoản cần đọc kỹ</h2><ul><li>Tiền cọc và điều kiện hoàn cọc</li><li>Chi phí phát sinh: điện, nước, internet, dịch vụ</li><li>Điều kiện chấm dứt hợp đồng và thông báo trước</li></ul><p>Nếu có điều khoản chưa rõ, nên yêu cầu bổ sung bằng văn bản trước khi ký.</p>",
                admin,
                cateLaw
        );
        upsertArticle(
                "meo-tiet-kiem-dien-nuoc-khi-o-tro",
                "Mẹo tiết kiệm điện nước khi ở trọ",
                "Những thói quen nhỏ giúp giảm hóa đơn hàng tháng đáng kể.",
                "https://images.pexels.com/photos/4239035/pexels-photo-4239035.jpeg",
                "<p>Bạn có thể giảm đáng kể chi phí bằng cách dùng đèn LED, cài điều hòa 26-27 độ, tận dụng ánh sáng tự nhiên và kiểm tra rò rỉ nước định kỳ.</p>",
                adminHust,
                cateSaving
        );
        upsertArticle(
                "cach-chon-phong-tro-phu-hop-voi-sinh-vien-nam-nhat",
                "Cách chọn phòng trọ phù hợp với sinh viên năm nhất",
                "Gợi ý ưu tiên vị trí, an ninh và ngân sách cho tân sinh viên.",
                "https://images.pexels.com/photos/1454360/pexels-photo-1454360.jpeg",
                "<p>Sinh viên năm nhất nên ưu tiên khu vực gần trường, có camera an ninh, chủ trọ rõ ràng và hợp đồng minh bạch. Không nên chọn phòng quá xa vì sẽ phát sinh chi phí đi lại.</p>",
                admin,
                cateNews
        );
        upsertArticle(
                "thiet-ke-goc-hoc-tap-toi-gian-trong-phong-tro-nho",
                "Thiết kế góc học tập tối giản trong phòng trọ nhỏ",
                "Mẹo bố trí không gian học tập hiệu quả ngay cả khi diện tích hạn chế.",
                "https://images.pexels.com/photos/4050291/pexels-photo-4050291.jpeg",
                "<p>Dùng bàn gấp, kệ treo tường và đèn bàn ánh sáng trung tính giúp tối ưu không gian. Giữ khu vực học tập gọn gàng để tăng khả năng tập trung.</p>",
                adminHust,
                cateLiving
        );
        upsertArticle(
                "bao-mat-thong-tin-khi-thue-phong-online",
                "Bảo mật thông tin khi thuê phòng online",
                "Những lưu ý quan trọng để tránh lộ thông tin cá nhân và bị lừa đảo.",
                "https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg",
                "<p>Không chia sẻ ảnh CCCD, tài khoản ngân hàng hoặc OTP cho bên thứ ba. Chỉ thanh toán khi đã xác minh phòng và danh tính chủ trọ.</p>",
                admin,
                cateLaw
        );

        Listing l1 = upsertListing(
                "Phòng trọ gần ĐH Bách Khoa",
                "Phòng mới xây, có máy lạnh, WC riêng, gần trường ĐH Bách Khoa.",
                new BigDecimal("3500000"),
                20.0,
                "Hẻm 123 Tô Hiến Thành, Phường 10, Quận 10, TP. Hồ Chí Minh",
                "Quận 10",
                landlord1
        );
        Listing l2 = upsertListing(
                "Chung cư mini full nội thất",
                "Căn hộ mini 1 phòng ngủ, bếp riêng, ban công thoáng.",
                new BigDecimal("7000000"),
                35.0,
                "Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh",
                "Quận Bình Thạnh",
                landlord1
        );
        Listing l3 = upsertListing(
                "Phòng trọ gần ĐH Bách Khoa Hà Nội",
                "Phòng có gác xép và khu để xe rộng, tiện sinh viên.",
                new BigDecimal("3200000"),
                18.0,
                "Giải Phóng, Phường Bách Khoa, Quận Hai Bà Trưng, Thành phố Hà Nội",
                "Quận Hai Bà Trưng",
                landlord2
        );
        Listing l4 = upsertListing(
                "Căn hộ studio gần Công viên Lê Văn Tám",
                "Studio full nội thất, có máy giặt riêng, phù hợp người đi làm.",
                new BigDecimal("8500000"),
                28.0,
                "Võ Thị Sáu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh",
                "Quận 1",
                landlord3
        );
        Listing l5 = upsertListing(
                "Phòng trọ có ban công thoáng mát",
                "Ban công lớn, cửa sổ đón nắng, khu dân cư yên tĩnh.",
                new BigDecimal("4200000"),
                23.0,
                "Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh",
                "Quận 5",
                landlord1
        );
        Listing l6 = upsertListing(
                "Phòng trọ giá tốt gần bến xe Mỹ Đình",
                "Phòng sạch sẽ, có nóng lạnh, khu vực thuận tiện đi lại.",
                new BigDecimal("2800000"),
                17.0,
                "Hồ Tùng Mậu, Phường Mai Dịch, Quận Cầu Giấy, Thành phố Hà Nội",
                "Quận Cầu Giấy",
                landlord2
        );
        Listing l7 = upsertListing(
                "Căn hộ mini cao cấp quận 7",
                "Không gian hiện đại, thang máy, bảo vệ 24/7.",
                new BigDecimal("9800000"),
                32.0,
                "Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh",
                "Quận 7",
                landlord4
        );
        Listing l8 = upsertListing(
                "Phòng trọ gần Đại học Kinh tế Quốc dân",
                "Phòng vuông vức, có cửa sổ lớn, internet ổn định.",
                new BigDecimal("3600000"),
                20.0,
                "Trần Đại Nghĩa, Phường Đồng Tâm, Quận Hai Bà Trưng, Thành phố Hà Nội",
                "Quận Hai Bà Trưng",
                landlord3
        );
        Listing l9 = upsertListing(
                "Nhà nguyên căn mini cho nhóm 3-4 người",
                "Phù hợp nhóm bạn hoặc gia đình nhỏ, có bếp riêng.",
                new BigDecimal("12000000"),
                52.0,
                "Lê Quang Định, Phường 11, Quận Bình Thạnh, TP. Hồ Chí Minh",
                "Quận Bình Thạnh",
                landlord4
        );
        Listing l10 = upsertListing(
                "Phòng trọ gần khu công nghệ cao Hoà Lạc",
                "Môi trường yên tĩnh, phù hợp kỹ sư và sinh viên thực tập.",
                new BigDecimal("2500000"),
                16.0,
                "Đại lộ Thăng Long, Xã Thạch Hòa, Huyện Thạch Thất, Thành phố Hà Nội",
                "Huyện Thạch Thất",
                landlord2
        );
        Listing l11 = upsertListing(
                "Phòng trọ full tiện nghi gần sân bay Tân Sơn Nhất",
                "Có máy lạnh, tủ lạnh, khu vực an ninh, giờ giấc tự do.",
                new BigDecimal("5600000"),
                24.0,
                "Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
                "Quận Tân Bình",
                landlord1
        );
        Listing l12 = upsertListing(
                "Phòng trọ yên tĩnh gần Hồ Tây",
                "Khu vực thoáng mát, phù hợp người đi làm và chuyên gia nước ngoài.",
                new BigDecimal("6800000"),
                27.0,
                "Xuân Diệu, Phường Quảng An, Quận Tây Hồ, Thành phố Hà Nội",
                "Quận Tây Hồ",
                landlord3
        );
        Listing l13 = upsertListing(
                "Studio hiện đại gần cầu Rồng Đà Nẵng",
                "Studio đầy đủ nội thất, khu bếp riêng, có ban công và máy giặt dùng riêng. Khu vực trung tâm, phù hợp người đi làm lâu dài.",
                new BigDecimal("6200000"),
                29.0,
                "Lê Đình Dương, Phường Hải Châu 1, Quận Hải Châu, Thành phố Đà Nẵng",
                "Quận Hải Châu",
                landlord5
        );
        Listing l14 = upsertListing(
                "Phòng trọ cao cấp gần Aeon Mall Long Biên",
                "Tòa nhà có thang máy, khóa vân tay, camera 24/7. Phòng mới tinh, có tủ quần áo, điều hòa, nóng lạnh, bếp từ.",
                new BigDecimal("5400000"),
                25.0,
                "Cổ Linh, Phường Long Biên, Quận Long Biên, Thành phố Hà Nội",
                "Quận Long Biên",
                landlord6
        );
        Listing l15 = upsertListing(
                "Phòng trọ sạch đẹp gần Đại học Cần Thơ",
                "Phòng thoáng, có sân phơi riêng, khu để xe rộng và cổng an ninh. Chủ trọ hỗ trợ nhanh khi có sự cố điện nước.",
                new BigDecimal("2900000"),
                19.0,
                "Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Thành phố Cần Thơ",
                "Quận Ninh Kiều",
                landlord5
        );
        Listing l16 = upsertListing(
                "Căn hộ mini gần biển Nha Trang",
                "View thoáng, nội thất tối giản, có bàn làm việc và đường truyền internet ổn định cho freelancer hoặc chuyên gia ở dài hạn.",
                new BigDecimal("7600000"),
                31.0,
                "Trần Phú, Phường Lộc Thọ, Thành phố Nha Trang, Tỉnh Khánh Hòa",
                "Thành phố Nha Trang",
                landlord6
        );
        upsertListingImage(l1, "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", 0);
        upsertListingImage(l1, "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg", 1);
        upsertListingImage(l2, "https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg", 0);
        upsertListingImage(l3, "https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg", 0);
        upsertListingImage(l4, "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg", 0);
        upsertListingImage(l5, "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg", 0);
        upsertListingImage(l6, "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg", 0);
        upsertListingImage(l7, "https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg", 0);
        upsertListingImage(l8, "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg", 0);
        upsertListingImage(l9, "https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg", 0);
        upsertListingImage(l10, "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg", 0);
        upsertListingImage(l11, "https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg", 0);
        upsertListingImage(l12, "https://images.pexels.com/photos/2029719/pexels-photo-2029719.jpeg", 0);
        upsertListingImage(l13, "https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg", 0);
        upsertListingImage(l13, "https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg", 1);
        upsertListingImage(l14, "https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg", 0);
        upsertListingImage(l14, "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg", 1);
        upsertListingImage(l15, "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg", 0);
        upsertListingImage(l16, "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg", 0);
        upsertListingImage(l16, "https://images.pexels.com/photos/3935324/pexels-photo-3935324.jpeg", 1);

        upsertPaymentOrder(landlord1, basic, BigDecimal.ZERO, PaymentOrderStatus.PAID, "SEED_PKG_BASIC_1", Instant.now().minusSeconds(60L * 60 * 24 * 60));
        upsertPaymentOrder(landlord1, pro, new BigDecimal("30000"), PaymentOrderStatus.PAID, "SEED_PKG_PRO_1", Instant.now().minusSeconds(60L * 60 * 24 * 25));
        upsertPaymentOrder(landlord1, proPlus, new BigDecimal("100000"), PaymentOrderStatus.PAID, "SEED_PKG_PROPLUS_1", Instant.now().minusSeconds(60L * 60 * 24 * 2));
        upsertPaymentOrder(landlord1, proPlus, new BigDecimal("100000"), PaymentOrderStatus.FAILED, "SEED_PKG_FAIL_1", Instant.now().minusSeconds(60L * 60 * 24 * 10));
        upsertPaymentOrder(tenant1, pro, new BigDecimal("30000"), PaymentOrderStatus.PAID, "SEED_TENANT_PRO_1", Instant.now().minusSeconds(60L * 60 * 24 * 5));
        upsertPaymentOrder(landlord2, pro, new BigDecimal("30000"), PaymentOrderStatus.PAID, "SEED_PKG_PRO_2", Instant.now().minusSeconds(60L * 60 * 24 * 18));
        upsertPaymentOrder(landlord3, proPlus, new BigDecimal("100000"), PaymentOrderStatus.PAID, "SEED_PKG_PROPLUS_2", Instant.now().minusSeconds(60L * 60 * 24 * 9));
        upsertPaymentOrder(landlord4, pro, new BigDecimal("30000"), PaymentOrderStatus.FAILED, "SEED_PKG_FAIL_2", Instant.now().minusSeconds(60L * 60 * 24 * 7));

        upsertStaticPage("about", "Giới thiệu về QL Phòng Trọ HUST", buildRichAboutContent());

        upsertFaq(0, "Làm sao để đăng ký tài khoản chủ trọ?", "<p>Chọn <b>Đăng ký</b>, chọn vai trò <b>Chủ trọ</b> và hoàn tất thông tin.</p>");
        upsertFaq(1, "Làm sao để lấy lại mật khẩu?", "<p>Vào <b>Quên mật khẩu</b>, nhập email và xác thực OTP để đặt mật khẩu mới.</p>");
        upsertFaq(2, "Vì sao phòng chưa hiển thị?", "<p>Phòng cần được <b>gửi duyệt</b> và admin phê duyệt trước khi hiển thị công khai.</p>");
        upsertFaq(3, "Tôi có thể chỉnh sửa tin đăng sau khi gửi duyệt không?", "<p>Bạn có thể chỉnh sửa khi tin ở trạng thái nháp hoặc bị từ chối. Tin đang chờ duyệt sẽ cần thao tác lại theo quy trình.</p>");
        upsertFaq(4, "Làm sao để tăng số lượng tin được đăng trong tháng?", "<p>Bạn có thể mua gói <b>Pro</b> hoặc <b>Pro+</b> để tăng quota đăng tin và nhận thêm quyền lợi.</p>");
        upsertFaq(5, "Nếu thanh toán thành công nhưng quota chưa cập nhật thì sao?", "<p>Hệ thống thường cập nhật tự động sau khi nhận IPN từ cổng thanh toán. Bạn có thể tải lại Dashboard sau vài phút hoặc liên hệ admin.</p>");
        upsertFaq(6, "Làm sao để tìm phòng theo khu vực cụ thể?", "<p>Ở trang tìm phòng, bạn có thể lọc theo tỉnh/thành, quận/huyện, phường/xã kết hợp mức giá và diện tích để ra kết quả chính xác hơn.</p>");
        upsertFaq(7, "Thông tin cá nhân của tôi có được bảo mật không?", "<p>Hệ thống áp dụng xác thực và phân quyền vai trò để bảo vệ thông tin. Bạn không nên chia sẻ OTP hoặc mật khẩu cho bất kỳ ai.</p>");
    }

    private User upsertUser(String email, String rawPassword, String fullName, String phone, UserRole role) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            user.setFullName(fullName);
            user.setPhone(phone);
            user.setRole(role);
            user.setEnabled(true);
            user.setEmailVerified(true);
            return userRepository.save(user);
        }
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .phone(phone)
                .role(role)
                .enabled(true)
                .emailVerified(true)
                .bonusListingSlots(0)
                .build());
    }

    private SubscriptionPackage upsertPackage(
            String code,
            String name,
            String description,
            BigDecimal price,
            int extraListings,
            Integer priorityDays,
            boolean active
    ) {
        Optional<SubscriptionPackage> existing = subscriptionPackageRepository.findByCodeAndActiveIsTrue(code);
        if (existing.isPresent()) return existing.get();
        return subscriptionPackageRepository.save(SubscriptionPackage.builder()
                .code(code)
                .name(name)
                .description(description)
                .priceVnd(price)
                .extraListingsPerMonth(extraListings)
                .priorityDays(priorityDays)
                .active(active)
                .build());
    }

    private DiscountCoupon upsertCoupon(
            String code,
            String discountType,
            int discountValue,
            Long maxDiscountVnd,
            String applicableJson,
            Integer maxUses,
            int perUserLimit,
            LocalDate validFrom,
            LocalDate validUntil,
            boolean active,
            String title
    ) {
        return discountCouponRepository.findByCodeIgnoreCase(code).orElseGet(() -> discountCouponRepository.save(DiscountCoupon.builder()
                .code(code)
                .discountType(discountType)
                .discountValue(discountValue)
                .maxDiscountVnd(maxDiscountVnd)
                .applicablePackageCodes(applicableJson)
                .maxUses(maxUses)
                .perUserLimit(perUserLimit)
                .validFrom(validFrom)
                .validUntil(validUntil)
                .isActive(active)
                .title(title)
                .build()));
    }

    private ArticleCategory upsertCategory(String slug, String name, int sortOrder) {
        return articleCategoryRepository.findBySlug(slug).orElseGet(() -> articleCategoryRepository.save(ArticleCategory.builder()
                .slug(slug)
                .name(name)
                .sortOrder(sortOrder)
                .build()));
    }

    private void upsertArticle(
            String slug,
            String title,
            String excerpt,
            String coverUrl,
            String body,
            User author,
            ArticleCategory category
    ) {
        if (articleRepository.findBySlugAndDeletedAtIsNull(slug).isPresent()) return;
        articleRepository.save(Article.builder()
                .slug(slug)
                .title(title)
                .excerpt(excerpt)
                .coverUrl(coverUrl)
                .body(body)
                .type(ArticleType.BLOG)
                .status(ArticleStatus.PUBLISHED)
                .author(author)
                .category(category)
                .publishedAt(Instant.now())
                .viewCount(0)
                .build());
    }

    private Listing upsertListing(
            String title,
            String description,
            BigDecimal price,
            Double areaM2,
            String address,
            String district,
            User owner
    ) {
        List<Listing> existing = listingRepository.findAll().stream()
                .filter(x -> x.getTitle() != null && x.getTitle().equalsIgnoreCase(title))
                .toList();
        if (!existing.isEmpty()) {
            Listing l = existing.get(0);
            // cập nhật seed cho phong phú hơn (kể cả khi đã có record cũ)
            l.setOwner(owner);
            l.setDescription(description);
            l.setPrice(price);
            l.setAreaM2(areaM2);
            l.setAddress(address);
            l.setDistrict(district);
            enrichListingSeed(l);
            return listingRepository.save(l);
        }
        Listing created = Listing.builder()
                .owner(owner)
                .title(title)
                .description(description)
                .price(price)
                .areaM2(areaM2)
                .address(address)
                .district(district)
                .status(ListingStatus.PUBLISHED)
                .publishedAt(Instant.now())
                .roomAvailable(true)
                .viewCount(0)
                .build();
        enrichListingSeed(created);
        return listingRepository.save(created);
    }

    private void enrichListingSeed(Listing l) {
        // Variations theo tiêu đề (deterministic)
        int h = Math.abs((l.getTitle() == null ? 0 : l.getTitle().hashCode()));
        int maxOcc = switch (h % 4) {
            case 0 -> 1;
            case 1 -> 2;
            case 2 -> 3;
            default -> 4;
        };
        String gender = switch (h % 3) {
            case 0 -> "any";
            case 1 -> "male";
            default -> "female";
        };
        if (l.getMaxOccupants() == null) l.setMaxOccupants(maxOcc);
        if (l.getGenderPolicy() == null || l.getGenderPolicy().isBlank()) l.setGenderPolicy(gender);

        if (l.getDeposit() == null && l.getPrice() != null) {
            BigDecimal mult = (h % 5 == 0) ? new BigDecimal("2") : BigDecimal.ONE;
            l.setDeposit(l.getPrice().multiply(mult));
        }

        if (l.getUtilitiesJson() == null || l.getUtilitiesJson().isBlank()) {
            // vài mẫu tiện ích khác nhau
            String u = switch (h % 4) {
                case 0 -> "{\"wifi\":true,\"giu_xe\":true,\"cho_de_xe\":true,\"nong_lanh\":true}";
                case 1 -> "{\"wifi\":true,\"may_lanh\":true,\"giu_xe\":true,\"tu_lanh\":true}";
                case 2 -> "{\"wifi\":true,\"thang_may\":true,\"cho_de_xe\":true,\"may_giat\":true}";
                default -> "{\"wifi\":true,\"may_lanh\":true,\"thang_may\":true,\"giu_xe\":true,\"cho_de_xe\":true,\"nong_lanh\":true,\"tu_lanh\":true,\"may_giat\":true,\"bep\":true}";
            };
            l.setUtilitiesJson(u);
        }

        if (l.getMapEmbedHtml() == null || l.getMapEmbedHtml().isBlank()) {
            String addr = l.getAddress() == null ? "" : l.getAddress().toLowerCase();
            String src;
            if (addr.contains("hà nội") || addr.contains("ha noi")) {
                src = "https://www.google.com/maps?q=H%C3%A0%20N%E1%BB%99i&output=embed";
            } else if (addr.contains("hồ chí minh") || addr.contains("ho chi minh") || addr.contains("tp. hồ chí minh")) {
                src = "https://www.google.com/maps?q=H%E1%BB%93%20Ch%C3%AD%20Minh&output=embed";
            } else if (addr.contains("đà nẵng") || addr.contains("da nang")) {
                src = "https://www.google.com/maps?q=%C4%90%C3%A0%20N%E1%BA%B5ng&output=embed";
            } else if (addr.contains("cần thơ") || addr.contains("can tho")) {
                src = "https://www.google.com/maps?q=C%E1%BA%A7n%20Th%C6%A1&output=embed";
            } else if (addr.contains("nha trang") || addr.contains("khánh hòa") || addr.contains("khanh hoa")) {
                src = "https://www.google.com/maps?q=Nha%20Trang&output=embed";
            } else {
                src = "https://www.google.com/maps?q=Vietnam&output=embed";
            }
            l.setMapEmbedHtml("""
                    <iframe src="%s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    """.formatted(src));
        }
    }

    private void upsertListingImage(Listing listing, String url, int sortOrder) {
        boolean exists = listingImageRepository.findAll().stream()
                .anyMatch(img -> img.getListing() != null
                        && img.getListing().getId().equals(listing.getId())
                        && img.getUrl() != null
                        && img.getUrl().equalsIgnoreCase(url));
        if (exists) return;
        listingImageRepository.save(ListingImage.builder()
                .listing(listing)
                .url(url)
                .sortOrder(sortOrder)
                .build());
    }

    private void upsertPaymentOrder(
            User user,
            SubscriptionPackage pkg,
            BigDecimal amount,
            PaymentOrderStatus status,
            String txnRef,
            Instant paidAt
    ) {
        if (paymentOrderRepository.findByVnpTxnRef(txnRef).isPresent()) return;
        paymentOrderRepository.save(PaymentOrder.builder()
                .user(user)
                .subscriptionPackage(pkg)
                .amountVnd(amount)
                .originalAmountVnd(amount)
                .discountAmountVnd(BigDecimal.ZERO)
                .status(status)
                .vnpTxnRef(txnRef)
                .vnpTransactionNo(status == PaymentOrderStatus.PAID ? "SEED_TXN_" + txnRef : null)
                .paidAt(status == PaymentOrderStatus.PAID ? paidAt : null)
                .rawIpnPayload("{\"seed\":true}")
                .build());
    }

    private StaticPage upsertStaticPage(String slug, String title, String html) {
        Optional<StaticPage> existing = staticPageRepository.findBySlug(slug);
        if (existing.isPresent()) {
            StaticPage p = existing.get();
            p.setTitle(title);
            p.setContentHtml(html);
            p.setPublished(true);
            return staticPageRepository.save(p);
        }
        return staticPageRepository.save(StaticPage.builder()
                .slug(slug)
                .title(title)
                .contentHtml(html)
                .published(true)
                .build());
    }

    private FaqItem upsertFaq(int sortOrder, String q, String aHtml) {
        Optional<FaqItem> existing = faqItemRepository.findAll().stream()
                .filter(x -> x.getQuestion() != null && x.getQuestion().equalsIgnoreCase(q))
                .findFirst();
        if (existing.isPresent()) {
            FaqItem item = existing.get();
            item.setSortOrder(sortOrder);
            item.setAnswerHtml(aHtml);
            item.setActive(true);
            return faqItemRepository.save(item);
        }
        return faqItemRepository.save(FaqItem.builder()
                .sortOrder(sortOrder)
                .question(q)
                .answerHtml(aHtml)
                .active(true)
                .build());
    }

    private String buildRichAboutContent() {
        return """
                <h2>QL Phòng Trọ HUST là gì?</h2>
                <p><b>QL Phòng Trọ HUST</b> là nền tảng quản lý và kết nối cho thuê trọ, giúp <b>người thuê</b> tìm phòng nhanh, rõ ràng và giúp <b>chủ trọ</b> vận hành hiệu quả hơn trong một hệ thống tập trung.</p>

                <h2>Tầm nhìn và định hướng</h2>
                <p>Chúng tôi hướng tới một hệ sinh thái thuê trọ số hóa, nơi thông tin minh bạch, trải nghiệm thân thiện và dữ liệu được quản lý có cấu trúc. Mục tiêu dài hạn là giảm tối đa rủi ro cho người thuê, đồng thời giúp chủ trọ tiết kiệm thời gian trong toàn bộ vòng đời quản lý phòng.</p>

                <h2>Giá trị nổi bật cho người thuê</h2>
                <ul>
                  <li>Tìm kiếm theo nhiều tiêu chí: khu vực, giá, diện tích, nhu cầu thực tế.</li>
                  <li>Danh sách phòng đã qua quy trình duyệt nội dung, hạn chế thông tin thiếu minh bạch.</li>
                  <li>Theo dõi bài viết, lưu/đánh dấu các nội dung hữu ích để ra quyết định thuê thông minh.</li>
                  <li>Truy cập FAQ và hướng dẫn để tránh các lỗi thường gặp khi thuê trọ lần đầu.</li>
                </ul>

                <h2>Giá trị nổi bật cho chủ trọ</h2>
                <ul>
                  <li>Quản lý danh sách phòng, trạng thái đăng và hình ảnh tại một nơi duy nhất.</li>
                  <li>Theo dõi quota đăng tin theo tháng và mở rộng linh hoạt bằng gói dịch vụ.</li>
                  <li>Hệ thống thanh toán và lịch sử giao dịch rõ ràng, thuận tiện kiểm tra đối soát.</li>
                  <li>Giao diện quản trị trực quan giúp thao tác nhanh ngay cả với người mới.</li>
                </ul>

                <h2>Cam kết chất lượng</h2>
                <p>Chúng tôi liên tục nâng cấp nền tảng theo hướng an toàn, ổn định và dễ sử dụng. Mỗi phiên bản đều tập trung vào cải thiện trải nghiệm thực tế: tốc độ tải, chất lượng dữ liệu, khả năng lọc tìm chính xác và các quy trình bảo vệ người dùng.</p>

                <h2>Thông điệp dành cho cộng đồng</h2>
                <p>QL Phòng Trọ HUST không chỉ là nơi đăng tin, mà còn là không gian chia sẻ tri thức và kinh nghiệm sống thực tế. Chúng tôi tin rằng một cộng đồng thuê trọ văn minh bắt đầu từ thông tin minh bạch, ứng xử tôn trọng và công cụ quản lý đúng cách.</p>

                <p><i>Cảm ơn bạn đã đồng hành cùng QL Phòng Trọ HUST. Chúng tôi luôn sẵn sàng lắng nghe để cải tiến tốt hơn mỗi ngày.</i></p>
                """;
    }
}
