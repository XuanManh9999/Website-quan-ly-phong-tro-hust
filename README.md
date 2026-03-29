# Website quản lý & tìm phòng trọ (HUST)

Monorepo gồm **front-end** (React, Vite, Ant Design) và **backend** (Spring Boot 3, Security + JWT, JPA).

Đặc tả nghiệp vụ: [`Y_TUONG_VA_DINH_HUONG_DU_AN.md`](./Y_TUONG_VA_DINH_HUONG_DU_AN.md).

## Chạy local

1. Backend: xem [`backend/README.md`](./backend/README.md) — `mvn spring-boot:run` (port **8080**).
2. Front-end: xem [`front-end/README.md`](./front-end/README.md) — `npm run dev` (port **5173**, proxy API).

## API versioning

Base path: **`/api/v1`** (auth, listings, articles, packages, payments, chat, admin).

## Ghi chú

- VNPay IPN trong code là **khung** (chữ ký đầy đủ cần bổ sung theo tài liệu VNPay).
- Gemini: cấu hình `GEMINI_API_KEY` trên backend; không đưa key ra client.
