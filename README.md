# Finance Tracker and Management System

This project includes a React frontend and an Express backend.

## Project structure

- `frontend/` — React + Vite app
- `backend/` — Express API server

## Run the application

### 1) Start the backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The API will run on `http://localhost:5000`.

### 2) Start the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Default demo login

- Email: `demo@example.com`
- Password: `demo123`

## Notes

The app uses a demo in-memory backend so it can run immediately without a database.
