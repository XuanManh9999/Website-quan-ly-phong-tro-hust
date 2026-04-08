# Website quản lý & tìm phòng trọ (HUST)

## Bản đặc tả ý tưởng & định hướng dự án (Living Document)

| Thuộc tính | Giá trị |
|------------|---------|
| Phiên bản tài liệu | 1.4 |
| Ngày cập nhật | 08/04/2026 |
| Đối tượng đọc | Product Owner, Dev, QA, thầy hướng dẫn |
| Phạm vi repo | `front-end` (React), `backend` (Spring Boot) |
| Trạng thái | Đặc tả + kế hoạch triển khai đang được đồng bộ theo code |

**Mục đích:** Mô tả **nghiệp vụ**, **kiến trúc**, **phân quyền**, **tích hợp** (VNPay, email, OTP, Gemini) và **nội dung** (tin đăng phòng, **bài viết**/blog/CMS) để triển khai thống nhất và có thể kiểm chứng (testable requirements).

---

## Mục lục

1. [Tóm tắt điều hành](#1-tóm-tắt-điều-hành-executive-summary)  
2. [Phạm vi & giả định](#2-phạm-vi--giả-định)  
3. [Tổng quan sản phẩm](#3-tổng-quan-sản-phẩm)  
4. [Kiến trúc & công nghệ](#4-kiến-trúc--công-nghệ)  
5. [Tác nhân & ma trận phân quyền](#5-tác-nhân--ma-trận-phân-quyền)  
6. [Nghiệp vụ cốt lõi](#6-nghiệp-vụ-cốt-lõi-chi-tiết)  
7. [Module bài viết, tin tức & nội dung (CMS nhẹ)](#7-module-bài-viết-tin-tức--nội-dung-cms-nhẹ)  
8. [Tích hợp bên thứ ba](#8-tích-hợp-bên-thứ-ba)  
9. [Dữ liệu & API (outline)](#9-dữ-liệu--api-outline)  
10. [Yêu cầu phi chức năng](#10-yêu-cầu-phi-chức-năng-nfr)  
11. [Bảo mật & tuân thủ](#11-bảo-mật--tuân-thủ)  
12. [Kiểm thử & chất lượng](#12-kiểm-thử--chất-lượng)  
13. [Triển khai & vận hành](#13-triển-khai--vận-hành)  
14. [Rủi ro & phụ thuộc](#14-rủi-ro--phụ-thuộc)  
15. [Lộ trình (roadmap)](#15-lộ-trình-roadmap)  
16. [Thuật ngữ](#16-thuật-ngữ)  
17. [Lịch sử sửa đổi tài liệu](#17-lịch-sử-sửa-đổi-tài-liệu)  
18. [Kế hoạch triển khai chi tiết (Execution checklist)](#18-kế-hoạch-triển-khai-chi-tiết-execution-checklist)  
19. [Definition of Done (DoD)](#19-definition-of-done-dod)  

---

## 1. Tóm tắt điều hành (Executive summary)

Nền tảng kết nối **người tìm phòng**, **chủ trọ** và **admin**, kèm **kênh nội dung** (bài viết: tin tức, kinh nghiệm thuê trọ, hướng dẫn sử dụng hệ thống) nhằm tăng **SEO**, **niềm tin** và **thời gian ở lại** trên site.

Điểm nhấn kỹ thuật: **React + Ant Design**, **Spring Boot + Security + JPA**, **OTP/email**, **VNPay**, **Gemini 2.5 Flash** (backend proxy, một API key). Nghiệp vụ chủ trọ: **5 tin đăng phòng / tháng**; vượt quota thì **mua gói** qua VNPay.

---

## 2. Phạm vi & giả định

**Trong phạm vi (In scope)**

- Đăng ký/đăng nhập, OTP, quản lý hồ sơ theo vai.
- Tin đăng phòng: tạo — duyệt — hiển thị — hết hạn; quota & gói dịch vụ.
- Bài viết/tin tức: danh mục, xuất bản, hiển thị public; quản trị bởi admin (và biên tập viên nếu có).
- Thanh toán VNPay cho gói; đối soát trạng thái đơn.
- Chatbot Gemini qua API nội bộ.
- Báo cáo/thống kê tổng quan cho admin.

**Ngoài phạm vi hoặc tùy chọn (Out of scope / Later)**

- Ứng dụng mobile native (có thể responsive web trước).
- Ký hợp đồng điện tử có giá trị pháp lý đầy đủ (cần tư vấn pháp lý).
- Thanh toán quốc tế, ví điện tử khác (mở rộng sau VNPay).

**Giả định**

- Người dùng có email/SĐT hợp lệ; SMTP hoạt động ổn định.
- VNPay: đã có tài khoản merchant sandbox/production và khóa bảo mật được quản lý an toàn.

---

## 3. Tổng quan sản phẩm

### 3.1. Vấn đề cần giải quyết

Thông tin phòng trọ phân tán, khó kiểm chứng; chủ trọ cần công cụ đăng tin có kiểm soát; người thuê cần tìm kiếm và **nội dung tham khảo** (bài viết) trên cùng một nơi.

### 3.2. Đề xuất giá trị

| Nhóm | Giá trị |
|------|---------|
| Người tìm phòng | Tìm/lọc nhanh, đọc bài viết hữu ích, liên hệ minh bạch, chatbot hỗ trợ |
| Chủ trọ | Quản lý tin, quota rõ ràng, nâng cấp bằng gói, thống kê cơ bản trên tin |
| Admin | Kiểm soát user/tin/bài viết, báo cáo, cấu hình gói & hệ thống |

### 3.3. Đối tượng sử dụng chính

Ba tác nhân: **Seeker**, **Landlord**, **Admin** (chi tiết mục 5).

---

## 4. Kiến trúc & công nghệ

### 4.1. Sơ đồ logic (khái niệm)

```text
[Browser / Mobile web]
        |
        v
[React SPA] <--HTTPS--> [Spring Boot API]
        |                      |
        |                      +--> [PostgreSQL]
        |                      +--> [SMTP / Email]
        |                      +--> [VNPay]
        |                      +--> [Gemini API]
        |
   Ant Design UI
```

### 4.2. Front-end (`front-end`)

| Hạng mục | Khuyến nghị |
|----------|-------------|
| Build tool | Vite + TypeScript |
| UI | Ant Design 5.x (Layout, Form, Table, Upload, Typography…) |
| HTTP | Axios + interceptors (Bearer JWT), xử lý lỗi tập trung |
| Routing | React Router 7 |
| State | Redux Toolkit hoặc Zustand (tuỳ độ phức tạp team) |
| Form & validation | Ant Form + Zod/Yup (tuỳ chọn) |
| Bản đồ | Leaflet + OpenStreetMap hoặc Google Maps API |
| Rich text (admin/bài viết) | Tiptap / Quill / Editor có sanitize HTML |

### 4.3. Back-end (`backend`)

| Hạng mục | Khuyến nghị |
|----------|-------------|
| Runtime | Java 17+ |
| Framework | Spring Boot 3.x |
| Security | Spring Security + JWT (access; refresh nếu cần) |
| ORM | Spring Data JPA |
| DB | PostgreSQL |
| Migration | Flyway hoặc Liquibase |
| Email | Spring Mail (SMTP) |
| OTP | Mã hash + TTL; lưu DB hoặc Redis |
| Lịch | `@Scheduled` (nhắc hết hạn tin, tổng hợp báo cáo ngày) |
| API contract | Springdoc OpenAPI (Swagger UI) |

### 4.4. Nguyên tắc tích hợp

- **Không** đưa secret (VNPay, Gemini, SMTP password) ra client.
- Idempotency cho webhook/IPN thanh toán (tránh cộng quota hai lần).
- Phân tách rõ **API public** (đọc tin, đọc bài) và **API bảo vệ** (ghi/sửa/xóa).

---

## 5. Tác nhân & ma trận phân quyền

### 5.1. Mô tả tác nhân

**Người tìm phòng (Seeker)**  
Đăng ký, tìm kiếm/lọc, xem chi tiết tin, yêu thích, đọc **bài viết**, dùng chatbot, báo cáo tin/bài (nếu bật tính năng).

**Chủ trọ (Landlord)**  
Tất cả quyền seeker (trừ khi tách hẳn tài khoản) + tạo/sửa tin phòng trong quota, mua gói, xem thống kê tin của mình. Không xuất bản bài viết hệ thống (trừ khi được gán role biên tập — mặc định không).

**Admin**  
Toàn quyền cấu hình: user, duyệt tin, **duyệt/xuất bản bài viết**, gói dịch vụ, báo cáo, cấu hình banner/SEO nội dung, xem log thanh toán.

### 5.2. Ma trận chức năng (rút gọn)

| Chức năng | Seeker | Landlord | Admin |
|-----------|:------:|:--------:|:-----:|
| Xem tin & bài public | ✓ | ✓ | ✓ |
| Tạo/sửa tin phòng | | ✓ | ✓ (moderate) |
| Duyệt tin | | | ✓ |
| Mua gói / thanh toán | | ✓ | |
| Viết & xuất bản bài viết | | | ✓ |
| Thống kê toàn hệ thống | | | ✓ |
| Chatbot | ✓ | ✓ | ✓ |

*(Có thể bổ sung role `EDITOR` nếu muốn tách admin hệ thống vs biên tập nội dung.)*

---

## 6. Nghiệp vụ cốt lõi (chi tiết)

### 6.1. Tài khoản & xác thực

- Đăng ký: email (bắt buộc) / SĐT (tuỳ chọn), mật khẩu (BCrypt).
- Đăng nhập: JWT; có thể bật **2FA qua OTP email** cho landlord/admin.
- OTP: đăng ký, quên mật khẩu, đổi email/SĐT, xác minh chủ trọ.
- Email giao dịch: xác nhận đơn gói, thông báo duyệt/từ chối tin, nhắc hết hạn gói/tin.

### 6.2. Tin đăng phòng (Listing)

- Trạng thái đề xuất: `DRAFT` → `PENDING_REVIEW` → `PUBLISHED` | `REJECTED` → `EXPIRED` / `HIDDEN`.
- Thuộc tính: tiêu đề, mô tả, giá, diện tích, địa chỉ, geo, tiện ích, ảnh (giới hạn số lượng & dung lượng), trạng thái còn phòng.
- **Quota 5 tin/tháng:** cần **quy tắc đếm** rõ ràng (ví dụ: đếm mỗi tin **chuyển sang PUBLISHED** trong tháng dương lịch `yyyy-MM`; tin bị ẩn vẫn đã tiêu slot hay không — ghi rõ trong backlog).

### 6.3. Gói dịch vụ & VNPay

- Gói ví dụ: thêm slot đăng tin, gói “ưu tiên hiển thị” N ngày, combo.
- Luồng: tạo đơn `PENDING` → redirect VNPay → **IPN** xác nhận → `PAID` → áp dụng quota/ưu tiên.
- Hoàn tiền/hủy: ngoài MVP hoặc quy trình thủ công qua admin + ghi log.

### 6.4. Chatbot Gemini (2.5 Flash)

- Endpoint backend duy nhất; prompt system cố định; giới hạn độ dài tin nhắn & số request/user/ngày.
- Không cam kết tư vấn pháp lý; trích dẫn nguồn bài viết nội bộ nếu có (RAG — phase sau).

### 6.5. Thống kê Admin

- User theo vai; tin theo trạng thái/thời gian; doanh thu theo gói; funnel “xem tin → liên hệ” (nếu đo được); top khu vực.
- **Đọc bài viết:** lượt xem, bài xem nhiều (cho quyết định nội dung).

---

## 7. Module bài viết, tin tức & nội dung (CMS nhẹ)

Mục tiêu: cung cấp **tin tức**, **mẹo thuê trọ**, **chính sách nền tảng**, **hướng dẫn** — tăng **SEO** và **độ tin cậy**, đồng thời là kênh thông báo chính thức (ví dụ: thay đổi phí, quy định đăng tin).

### 7.1. Loại nội dung đề xuất

| Loại | Mô tả | Ví dụ |
|------|--------|--------|
| Tin tức | Thông báo, cập nhật sản phẩm | Ra mắt tính năng X, bảo trì hệ thống |
| Kinh nghiệm / Blog | Bài dài, hình ảnh | Cách đọc hợp đồng thuê trọ, checklist xem phòng |
| Hướng dẫn (Guide) | Step-by-step | Cách đăng tin, cách mua gói, cách nạp tiền VNPay |
| Chính sách | Văn bản cố định | Điều khoản, bảo mật, quy chế đăng tin |

### 7.2. Thuộc tính bài viết (Article / Post)

- **Slug** URL thân thiện SEO (`/tin-tuc/slug-bai-viet`).
- **Tiêu đề**, **tóm tắt (excerpt)**, **nội dung HTML/Markdown** (sanitize khi render).
- **Ảnh đại diện (cover)**, **tác giả** (user admin/editor), **thời gian tạo/cập nhật**.
- **Danh mục (Category)** — phân cấp 1 cấp hoặc 2 cấp (tuỳ độ phức tạp).
- **Thẻ (Tags)** — tùy chọn, hỗ trợ lọc.
- **Trạng thái:** `DRAFT`, `PENDING_REVIEW` (nếu có quy trình), `PUBLISHED`, `ARCHIVED`.
- **Lên lịch xuất bản (scheduled)** — tùy chọn phase 2.
- **SEO:** meta title, meta description, Open Graph image (tuỳ chọn).
- **Đếm lượt xem** (view count) — tăng khi load trang chi tiết (chống spam bằng debounce/session).

### 7.3. Quyền thao tác

- **Admin (và Editor nếu có):** CRUD danh mục, tags; tạo/sửa/xóa mềm bài; xuất bản/ẩn.
- **Seeker/Landlord:** chỉ **đọc** bài public; có thể **chia sẻ** link; **báo cáo** nội dung sai (tuỳ chọn).
- **Không** cho landlord tự đăng bài PR trên kênh tin chính thức (tránh spam) — hoặc có **kênh riêng “Cộng đồng”** phase sau với kiểm duyệt.

### 7.4. Giao diện người dùng

- Trang **Danh sách bài viết** (lọc theo danh mục, tag, tìm kiếm).
- Trang **Chi tiết bài** (typography chuẩn, mục lục nội dung dài — tuỳ chọn).
- **Bài liên quan** (cùng danh mục / tag).
- **Sidebar:** bài nổi bật, gợi ý tìm phòng (CTA).
- Trang admin: bảng quản lý bài viết (Ant Design Table), preview trước khi publish.

### 7.5. Liên kết với phần còn hệ thống

- Footer/Header: link **Điều khoản**, **Chính sách bảo mật** (bài dạng `STATIC_PAGE` hoặc Article đặc biệt).
- Chatbot có thể trả lời: “Xem thêm hướng dẫn tại [link bài]” (danh sách slug do admin cấu hình hoặc search nội bộ).

---

## 8. Tích hợp bên thứ ba

| Dịch vụ | Vai trò | Ghi chú |
|---------|---------|---------|
| SMTP | Gửi OTP, thông báo giao dịch | SPF/DKIM nên cấu hình khi production |
| VNPay | Thanh toán gói | IPN verify chữ ký; log raw callback |
| Gemini 2.5 Flash | Chatbot | Rate limit; không log full PII |
| (Tuỳ chọn) Object storage | Ảnh tin & cover bài | S3-compatible / Cloudinary |

---

## 9. Dữ liệu & API (outline)

### 9.1. Thực thể bổ sung cho bài viết

- `ArticleCategory` (id, name, slug, parent_id nullable, sort_order)
- `ArticleTag` + `ArticleTagAssignment` (many-to-many)
- `Article` (id, slug, title, excerpt, body, status, cover_url, author_id, category_id, published_at, view_count, meta_title, meta_description, created_at, updated_at, deleted_at)
- `StaticPage` hoặc dùng `Article` với `type = POLICY` (tuỳ modeling)

### 9.2. API nhóm (REST)

- `POST/GET /api/auth/...` — đăng ký, login, refresh, OTP
- `GET /api/listings` — public search; `.../api/landlord/listings` — CRUD
- `GET /api/articles` — public list (filter); `GET /api/articles/{slug}`
- `POST /api/admin/articles` — CRUD admin; `PATCH .../publish`
- `POST /api/payments/vnpay/create` — `POST /api/payments/vnpay/ipn`
- `POST /api/chat` — Gemini proxy
- `GET /api/admin/analytics/...` — thống kê tổng hợp

Chi tiết schema request/response nên mô tả trong **OpenAPI** khi code.

---

## 10. Yêu cầu phi chức năng (NFR)

| ID | Tiêu chí | Mục tiêu gợi ý |
|----|-----------|----------------|
| NFR-01 | Thời gian phản hồi API (p95) | < 500 ms cho đọc danh sách có phân trang (không tính cold start) |
| NFR-02 | Uptime | 99% MVP (môi trường học tập có thể thấp hơn) |
| NFR-03 | Khả năng mở rộng | Stateless API để scale ngang sau này |
| NFR-04 | Sao lưu | Backup DB định kỳ (manual/script tuỳ môi trường) |
| NFR-05 | Giám sát | Log tập trung; lỗi 5xx có stack trace (ẩn chi tiết với client) |
| NFR-06 | SEO (public) | Slug, meta cơ bản; SSR có thể để phase sau (Vite SPA + prerender tuỳ chọn) |

---

## 11. Bảo mật & tuân thủ

- Role: `ROLE_SEEKER`, `ROLE_LANDLORD`, `ROLE_ADMIN` (+ `ROLE_EDITOR` nếu tách).
- JWT ngắn hạn; HTTPS bắt buộc production; CORS chỉ domain front-end.
- Validation đầu vào; sanitize HTML nội dung bài viết & mô tả tin.
- Upload: giới hạn MIME (jpg/png/webp), kích thước, scan cơ bản.
- Audit log: hành động admin (khóa user, xóa tin/bài, đổi trạng thái thanh toán).
- **Bảo vệ dữ liệu cá nhân:** không hiển thị SĐT/email đầy đủ cho user chưa được phép (tuỳ rule nghiệp vụ).

---

## 12. Kiểm thử & chất lượng

- **Unit test:** service (quota, thanh toán idempotent, chuyển trạng thái bài/tin).
- **Integration test:** JPA + Testcontainers (PostgreSQL) cho repository quan trọng.
- **API test:** MockMvc hoặc RestAssured cho auth + RBAC.
- **E2E (tuỳ thời gian):** Playwright/Cypress cho luồng đăng nhập, tạo tin, admin duyệt.
- **Checklist VNPay:** sandbox success/fail/IPN trùng.

---

## 13. Triển khai & vận hành

- Môi trường: `local`, `staging` (tuỳ chọn), `production`.
- Biến môi trường: `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `VNPAY_*`, `GEMINI_API_KEY`, `FRONTEND_ORIGIN`.
- Pipeline CI: build + test + lint (GitHub Actions/GitLab CI — khi có repo).
- Quản lý version API: prefix `/api/v1` nếu dự kiến thay đổi lớn.

---

## 14. Rủi ro & phụ thuộc

| Rủi ro | Mức độ | Giảm thiểu |
|--------|--------|------------|
| Spam tin & bài | Cao | Duyệt tin, captcha khi đăng ký, rate limit |
| Sai lệch thanh toán | Cao | IPN idempotent, đối soát đơn, log đầy đủ |
| Lạm dụng Gemini | Trung bình | Rate limit, giới hạn token, filter nội dung |
| Pháp lý thuê trọ / trung gian thanh toán | Trung bình | MVP: ưu tiên kết nối & minh bạch; hạn chế “giữ tiền” nếu chưa đủ điều kiện |

---

## 15. Lộ trình (roadmap)

1. **MVP:** Auth + OTP email; Listing + duyệt + quota + VNPay; **Article cơ bản (admin publish)** + trang public đọc bài; Chat Gemini; dashboard admin tối thiểu.
2. **V1.1:** Tags, related articles, view count chống spam; báo cáo đọc bài; scheduled publish.
3. **V2:** Tin nhắn nội bộ, đánh giá, thông báo realtime, RAG cho chatbot từ kho bài viết.
4. **V3:** Tối ưu SEO nâng cao (SSR/prerender), Elasticsearch nếu dữ liệu lớn.

---

## 16. Thuật ngữ

| Thuật ngữ | Giải thích ngắn |
|-----------|------------------|
| Listing | Tin đăng phòng cho thuê |
| Quota | Hạn mức số tin đăng trong chu kỳ |
| IPN | Thông báo thanh toán server-to-server (VNPay) |
| CMS | Hệ thống quản lý nội dung (ở đây dạng nhẹ: bài viết + trang tĩnh) |
| OTP | Mã dùng một lần, có thời hạn |

---

## 17. Lịch sử sửa đổi tài liệu

| Phiên bản | Ngày | Nội dung thay đổi |
|-----------|------|-------------------|
| 1.0 | (ban đầu) | Khung ý tưởng: stack, 3 vai, listing, VNPay, Gemini |
| 1.1 | 29/03/2026 | Bổ sung module **bài viết/CMS**, ma trận quyền, NFR, kiểm thử, triển khai, rủi ro, thuật ngữ; chỉnh lại cấu trúc tài liệu |
| 1.2 | 08/04/2026 | Chuẩn hóa tài liệu theo trạng thái triển khai thực tế front-end; bổ sung checklist thực thi, DoD và phụ lục tăng trưởng |
| 1.3 | 08/04/2026 | Cập nhật trạng thái hoàn thiện: landlord/admin/payment UI, route guard FE, chatbot ổn định hơn; loại bỏ ghi chú lạc phạm vi |
| 1.4 | 08/04/2026 | Bổ sung trang kết quả thanh toán VNPay, nâng cấp chatbot (retry + lưu phiên + gợi ý nhanh), hoàn thiện form SEO bài viết |

---

*Tài liệu “living document”: cập nhật phiên bản và mục 17 mỗi khi thay đổi nghiệp vụ hoặc phạm vi kỹ thuật đáng kể.*


## 18. Kế hoạch triển khai chi tiết (Execution checklist)

Mục này dùng như checklist để triển khai và nghiệm thu theo sprint.

### 18.1. Trạng thái hiện tại (snapshot)

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|---------|
| Front-end public pages (Home, Listing, Article, Login) | Đang tốt | Đã tách component, có lazy loading route, có render Markdown |
| Chatbot widget (UI) | Đang tốt | Đã có Drawer chat + gọi API backend |
| Admin CMS bài viết (UI + API) | Chưa hoàn tất | Cần CRUD, publish flow, preview |
| Landlord listing workflow | Chưa hoàn tất | Cần tạo/sửa/submit duyệt + quota |
| VNPay end-to-end | Chưa hoàn tất | Cần IPN idempotent + đối soát |
| OTP + hardening bảo mật | Chưa hoàn tất | Cần rà soát rate-limit, audit log |

### 18.2. Checklist theo module

#### A) Authentication & Profile
- [ ] Đăng ký/đăng nhập + refresh token (nếu dùng)
- [ ] OTP luồng quên mật khẩu/đổi email
- [ ] Role guard ở FE và BE (`SEEKER`, `LANDLORD`, `ADMIN`)
- [ ] Trang hồ sơ cá nhân (xem/sửa thông tin cơ bản)

#### B) Listing & Quota
- [ ] CRUD tin cho landlord (ảnh, địa chỉ, giá, mô tả)
- [ ] Submit duyệt (`PENDING_REVIEW`) và admin duyệt/reject
- [ ] Rule quota 5 tin/tháng được đặc tả + test rõ ràng
- [ ] Bộ lọc nâng cao (giá min/max, diện tích, tiện ích)

#### C) Bài viết/CMS
- [ ] Admin CRUD bài viết + category + tag
- [ ] Trạng thái bài viết `DRAFT/PUBLISHED/ARCHIVED`
- [ ] SEO fields (meta title/description, og image)
- [ ] Public page có bài liên quan + view count chống spam

#### D) Payment VNPay
- [ ] Tạo payment intent/order
- [ ] Redirect + return URL xử lý trạng thái
- [ ] IPN verify chữ ký + idempotent
- [ ] Áp dụng quota/gói sau khi `PAID` + audit log

#### E) Chatbot Gemini
- [ ] Giới hạn request/user/ngày
- [ ] Filter prompt nhạy cảm + cảnh báo pháp lý
- [ ] Gợi ý link bài viết liên quan trong câu trả lời
- [ ] Chuẩn bị phase 2: RAG từ kho bài viết

#### F) Admin Analytics
- [ ] Dashboard user/listing/payment/article
- [ ] Biểu đồ theo ngày/tuần/tháng
- [ ] Export CSV cơ bản (tùy chọn)

### 18.3. Mốc bàn giao đề xuất

| Sprint | Phạm vi chính | Kết quả kỳ vọng |
|--------|---------------|-----------------|
| Sprint 1 | Auth + Listing public + CMS public | User tìm được phòng, đọc bài ổn định |
| Sprint 2 | Landlord workflow + quota + admin duyệt | Vận hành đăng tin đúng nghiệp vụ |
| Sprint 3 | VNPay + analytics + hardening | Sẵn sàng demo end-to-end |

## 19. Definition of Done (DoD)

Một hạng mục chỉ coi là "xong" khi đạt đủ:

- [ ] Có đặc tả ngắn gọn (input/output, role, edge cases)
- [ ] Có API contract rõ ràng (OpenAPI hoặc tài liệu endpoint)
- [ ] Có test tối thiểu (unit/integration hoặc checklist test tay có bằng chứng)
- [ ] Có xử lý loading/error/empty state ở front-end
- [ ] Có log và thông báo lỗi đủ để debug ở backend
- [ ] Không có lỗi lint/build; không lộ secret trong code/repo
- [ ] Đã cập nhật lại tài liệu này (mục 17 + mục liên quan)

---

## Phụ lục A - Gợi ý tăng trưởng & vận hành nội dung

### A.1. Thu hút người dùng

**Kênh miễn phí**
- Đăng vào hội nhóm sinh viên, thuê nhà (Facebook, Zalo, TikTok community).
- Nội dung ngắn dạng checklist/kinh nghiệm để kéo về bài chi tiết trên website.

**Kênh trả phí**
- Chạy quảng cáo Google/Facebook theo khu vực quanh HUST.
- Tập trung landing page nhanh, rõ CTA và có social proof (đánh giá, số tin mới).

### A.2. Chiến lược nội dung

- Viết cụm bài SEO theo nhu cầu thật: giá phòng theo khu vực, checklist xem phòng, hợp đồng.
- Mỗi bài có CTA rõ: "Xem phòng theo khu vực", "Dùng chatbot để lọc nhanh".

### A.3. Uy tín & chống lừa đảo

- Cơ chế đánh giá chủ trọ/người thuê sau giao dịch.
- Ưu tiên hiển thị tin đã xác minh và tài khoản có lịch sử tốt.

### A.4. Ghi chú AI/RAG

- Phase hiện tại: Gemini 2.5 Flash qua backend proxy.
- Phase sau: RAG từ kho bài viết + FAQ nội bộ để tăng độ chính xác và khả năng dẫn nguồn.
