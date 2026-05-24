# Drug Interaction Checker — Backend

Backend API cho Drug Interaction Checker — NestJS REST API kết nối SQL Server với dữ liệu DrugBank và GDSC2.

## Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** SQL Server (MSSQL)
- **Auth:** JWT (Passport) + bcrypt
- **Email:** Nodemailer (Gmail SMTP)
- **Docs:** Swagger / OpenAPI (`/api`)

## Yêu cầu

- Node.js >= 18
- npm >= 9
- SQL Server (hoặc SQL Server Express) đang chạy
- Đã import dữ liệu DrugBank vào database
- Gmail App Password (cho chức năng quên mật khẩu)

## Cài đặt & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file môi trường
cp .env.example .env
```

Chỉnh `.env`:

```env
# Database (SQL Server)
DB_HOST=localhost
DB_PORT=1433
DB_INSTANCE=SQLEXPRESS
DB_USERNAME=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_DATABASE=DrugInteractionDB

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Gmail SMTP (App Password — không dùng mật khẩu thật)
# Lấy tại: https://myaccount.google.com/apppasswords
MAIL_USER=your.email@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

```bash
# 3. Import dữ liệu (chạy 1 lần)
cd data
python parse_drugbank.py        # parse DrugBank XML → CSV
python import_to_sqlserver.py   # import CSV → SQL Server
cd ..

# 4. Chạy dev server
npm run start:dev
```

API chạy tại **http://localhost:3001**  
Swagger docs tại **http://localhost:3001/api**

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run start:dev` | Dev server (watch mode) |
| `npm run build` | Build production |
| `npm run start:prod` | Chạy production build |
| `npm run lint` | Kiểm tra và fix lint |
| `npm run test` | Chạy unit tests |

## Cấu trúc thư mục

```
src/
├── auth/              # JWT auth, register, login, forgot/reset password
├── mail/              # MailService — Gmail SMTP
├── dashboard/         # Stats tổng hợp
├── drugs/             # Drug search/autocomplete
├── ddi/               # Drug-Drug Interaction
├── dti/               # Drug-Target Interaction
├── drug-food/         # Drug-Food Interaction
├── drug-condition/    # Drug-Condition (chỉ định, bệnh lý)
├── drug-response/     # Drug Response (GDSC2 — tế bào ung thư)
├── drug-side-effects/ # Drug Side Effects
├── search-history/    # Lịch sử tìm kiếm
├── entities/          # TypeORM entities
└── main.ts
data/
├── parse_drugbank.py        # Parse DrugBank XML
├── import_to_sqlserver.py   # Import vào SQL Server
└── import_to_mssql.sql      # SQL script thủ công
```

## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/auth/register` | Đăng ký tài khoản |
| `POST` | `/auth/login` | Đăng nhập, trả JWT |
| `GET` | `/auth/profile` | Thông tin user hiện tại (JWT) |
| `POST` | `/auth/change-password` | Đổi mật khẩu (JWT) |
| `POST` | `/auth/forgot-password` | Gửi email reset mật khẩu |
| `POST` | `/auth/reset-password` | Đặt mật khẩu mới bằng token |

### Drugs
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/drugs/suggest?q=` | Autocomplete tên thuốc |
| `GET` | `/drugs/:id` | Chi tiết thuốc theo ID |

### Interactions
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/ddi/search?drugAId=&drugBId=` | Tương tác 2 thuốc |
| `POST` | `/ddi/multi` | Tương tác nhiều thuốc |
| `GET` | `/dti/by-drug?drugId=` | Targets của thuốc |
| `GET` | `/drug-food/by-drug?drugId=` | Tương tác thực phẩm |
| `GET` | `/drug-condition/by-drug?drugId=` | Chỉ định / bệnh lý |
| `GET` | `/drug-response/by-name?name=` | Drug response (GDSC2) |
| `GET` | `/drug-side-effects/by-drug?drugId=` | Tác dụng phụ |

### Khác
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/dashboard/stats` | Thống kê tổng quan |
| `GET` | `/search-history` | Lịch sử tìm kiếm (JWT) |
| `GET` | `/search-history/recent` | 5 tìm kiếm gần nhất (JWT) |
