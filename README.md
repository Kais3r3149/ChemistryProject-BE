# ChemistryProject-BE

Backend API cho Drug Interaction Checker — NestJS REST API kết nối SQL Server với dữ liệu DrugBank.

## Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** SQL Server (MSSQL)
- **Auth:** JWT (Passport)
- **Docs:** Swagger / OpenAPI

## Yêu cầu

- Node.js >= 18
- npm >= 9
- SQL Server (hoặc SQL Server Express) đang chạy
- Đã import dữ liệu DrugBank vào database

## Cài đặt & Chạy

```bash
# 1. Clone repo
git clone https://github.com/Kais3r3149/ChemistryProject-BE.git
cd ChemistryProject-BE/drug-interaction-checker

# 2. Cài dependencies
npm install

# 3. Tạo file môi trường
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

# App
PORT=3001
NODE_ENV=development
```

```bash
# 4. Import dữ liệu DrugBank (chạy 1 lần)
cd data
python parse_drugbank.py        # parse XML → CSV
python import_to_sqlserver.py   # import CSV → SQL Server
cd ..

# 5. Chạy dev server
npm run start:dev
```

API chạy tại **http://localhost:3001**  
Swagger docs tại **http://localhost:3001/api**

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run start:dev` | Chạy development server (watch mode) |
| `npm run build` | Build production |
| `npm run start:prod` | Chạy production build |
| `npm run lint` | Kiểm tra và fix lint |
| `npm run test` | Chạy unit tests |

## Cấu trúc thư mục

```
drug-interaction-checker/
├── src/
│   ├── auth/              # JWT auth, login, register
│   ├── dashboard/         # Stats tổng hợp
│   ├── ddi/               # Drug-Drug Interaction module
│   ├── dti/               # Drug-Target Interaction module
│   ├── drug-food/         # Drug-Food Interaction module
│   ├── drug-condition/    # Drug Condition module
│   ├── search-history/    # Lịch sử tìm kiếm
│   ├── entities/          # TypeORM entities
│   └── main.ts
├── data/
│   ├── parse_drugbank.py        # Parse DrugBank XML
│   ├── import_to_sqlserver.py   # Import vào SQL Server
│   └── import_to_mssql.sql      # SQL script thủ công
└── .env.example
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/auth/register` | Đăng ký tài khoản |
| `POST` | `/auth/login` | Đăng nhập, trả JWT |
| `GET` | `/ddi?drugA=&drugB=` | Tìm tương tác Drug-Drug |
| `GET` | `/dti?drug=` | Tìm targets của thuốc |
| `GET` | `/drug-food?drug=` | Tìm tương tác Drug-Food |
| `GET` | `/drug-condition?drug=` | Tìm chỉ định và độc tính |
| `GET` | `/search-history` | Lịch sử tìm kiếm (JWT required) |
| `GET` | `/search-history/recent` | 5 tìm kiếm gần nhất |
| `GET` | `/dashboard/stats` | Thống kê tổng quan |
| `GET` | `/drugs/suggest?q=` | Autocomplete tên thuốc |
