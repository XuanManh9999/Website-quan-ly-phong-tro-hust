# Room Rental API (Spring Boot)

## Chạy nhanh (dev)

- JDK 17+, Maven 3.9+
- Profile mặc định `dev`: H2 in-memory, Swagger, CORS `http://localhost:5173`

```bash
cd backend
mvn spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- H2 Console: `http://localhost:8080/h2-console` (JDBC URL trong `application-dev.yml`)

## PostgreSQL

```bash
set SPRING_PROFILES_ACTIVE=postgres
set DATABASE_URL=jdbc:postgresql://localhost:5432/room_rental
mvn spring-boot:run
```

## Tài khoản seed (dev)

- Admin: `admin@hust.local` / `Admin@123456`

## Biến môi trường quan trọng

| Biến | Mô tả |
|------|--------|
| `JWT_SECRET` | Chuỗi dài cho ký JWT (production bắt buộc đổi) |
| `FRONTEND_ORIGIN` | Origin front-end cho CORS |
| `GEMINI_API_KEY` | Bật chatbot thật (không bắt buộc để chạy API) |
| `VNPAY_*` | Cấu hình merchant VNPay khi go-live |

## Cấu trúc gói

- `config` — Security, OpenAPI, CORS, seed data
- `controller` — REST theo version `/api/v1`
- `domain/entity` + `domain/enums`
- `repository` — Spring Data JPA
- `service` + `service/impl`
- `integration` — Gemini, VNPay (stub/verify)
- `security` — JWT filter + `UserDetails`
- `exception` — xử lý lỗi thống nhất
