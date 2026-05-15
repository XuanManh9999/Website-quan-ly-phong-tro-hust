# Website quản lý & tìm phòng trọ (HUST)

Monorepo gồm **front-end** (React, Vite, Ant Design) và **backend** (Spring Boot 3, Security + JWT, JPA).

Đặc tả nghiệp vụ: [`Y_TUONG_VA_DINH_HUONG_DU_AN.md`](./Y_TUONG_VA_DINH_HUONG_DU_AN.md).

## Chạy local

1. Backend: xem [`backend/README.md`](./backend/README.md) — `mvn spring-boot:run` (port **8080**).
2. Front-end: xem [`front-end/README.md`](./front-end/README.md) — `npm run dev` (port **5173**, proxy API).

## API (REST)

Front-end SPA gọi trực tiếp backend trên các path **gốc** (không prefix `/api/v1`): `/auth/**`, `/rooms/**`, `/posts/**`, `/post-categories/**`, `/packages/**`, `/payments/**`, `/chat/**`, `/locations/**`, `/coupons/**`, `/admin/**`.

## Ghi chú

- VNPay IPN trong code là **khung** (chữ ký đầy đủ cần bổ sung theo tài liệu VNPay).
- Gemini: cấu hình `GEMINI_API_KEY` trên backend; không đưa key ra client.

## Tiến độ migrate NodeJS -> Spring Boot

- [x] Bổ sung compatibility route `/packages/**` (public + admin).
- [x] Bổ sung compatibility route `/admin/summary`.
- [x] Bổ sung compatibility route `/auth/**` cho luồng cũ: `register`, `login`, `me`, `forgot-password`, `verify-reset-otp`, `reset-password`, `update profile`, `change-password`.
- [x] Cập nhật security để cho phép các compatibility endpoint public cần thiết hoạt động đúng (không bị chặn 401 sai).
- [x] Bổ sung compatibility route `/rooms/**` (public list/detail, landlord CRUD, admin duyệt/từ chối, ảnh phòng).
- [x] Bổ sung compatibility route `/posts/**` (public, admin CRUD, publish/unpublish, bookmark).
- [x] Bổ sung compatibility route `/post-categories/**` (public + admin CRUD).
- [x] Bổ sung compatibility route `/payments/**` (gói hiện tại, lịch sử, preview/create/return VNPay).
- [x] Bổ sung compatibility route `/chat/**` (`status`, `send message` theo payload front-end mới).
- [x] Bổ sung compatibility route `/locations/**` (provinces cache từ open-api.vn).
- [x] Bổ sung compatibility route `/coupons/**` (admin CRUD + landlord promotions).
- [x] Đồng bộ dữ liệu coupon usage thực tế (`paid_uses`, `active_uses`, `userUses`) từ payment orders.
- [x] Đồng bộ payment history với `couponCode`, `originalAmount`, `discountAmount`.
- [x] Nâng cấp chatbot: hỗ trợ gợi ý phòng theo giá (dưới / trên / khoảng triệu) + quận/huyện, trả room cards cho UI.
