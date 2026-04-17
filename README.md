f   # Elingo_Edu_System

A platform connecting teachers to hold live classes.

## Structure

```
EXE201_Elingo_System /
├── frontend/          # Frontend (React + TypeScript + Vite)
├── backend/           # Backend Application (Spring boot + Mongo + Postgres)
├── .gitignore
└── README.md
```

## Hướng dẫn chạy dự án

Đảm bảo bạn đã cài đặt **Docker Desktop** trên máy.

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   mvn spring-boot:run
   docker compose up -d
   ```
2. Cài đặt và chạy Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
