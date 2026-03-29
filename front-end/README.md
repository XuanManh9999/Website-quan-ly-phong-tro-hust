# Front-end (React + Vite + Ant Design)

## Chạy dev

```bash
cd front-end
npm install
npm run dev
```

Mặc định proxy `/api` → `http://localhost:8080` (xem `vite.config.ts`). Client gọi đường dẫn tương đối `/api/...` khi không set `VITE_API_URL`.

## Build

```bash
npm run build
```

## Cấu trúc

- `src/api` — Axios + interceptor JWT (`localStorage.accessToken`)
- `src/layouts` — khung trang Ant Design
- `src/pages` — các màn hình mẫu
