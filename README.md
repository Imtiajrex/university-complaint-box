University Complaint Box

Overview

- Monorepo with a React + Vite frontend at the root and a Bun + Hono + MongoDB backend in backend/.
- Goal: allow students to submit complaints, admins to respond, and owners to give feedback.

Project layout

- Frontend (this folder): Vite + React + TypeScript + Tailwind CSS, React Router, TanStack Query
- Backend (backend/): Bun runtime, Hono framework, MongoDB, JWT auth

Frontend summary

- Tech: Vite, React 18, TypeScript, Tailwind CSS, React Router, TanStack Query
- Auth: JWT stored in localStorage (token)
- API client: src/lib/api.ts centralizes calls to the backend using fetch with Bearer token
  - Base URL: currently points to https://university-complaint-box.onrender.com/api by default
  - Intended env: REACT_APP_BACKEND_URL (should include /api). If you run the backend locally, update the base URL in src/lib/api.ts or wire it to the env var.
- Key folders: components/, pages/, contexts/ (AuthContext, ComplaintsContext), data/mockData.ts

Frontend scripts

- Install deps: npm install
- Dev server: npm run dev
- Build: npm run build
- Preview build: npm run preview

Backend summary (backend/)

- Tech: Bun, Hono, MongoDB, jsonwebtoken, bcryptjs
- Dev server default URL: http://localhost:8787 (see backend README)
- Environment (.env):
  - SECRET_KEY: JWT secret
  - MONGO_URL: Mongo connection string (must include DB name)
  - ACCESS_TOKEN_EXPIRE_MINUTES: default 60
  - REACT_APP_BACKEND_URL: for the frontend, e.g. http://localhost:8787/api

Backend scripts

- Install deps: bun install
- Dev: bun run dev
- Start: bun run start

API endpoints (prefix /api)

- GET /health -> { status: "ok" }
- POST /auth/register { name,email,password,role,department?,studentId? } -> { access_token, token_type }
- POST /auth/login (x-www-form-urlencoded: username,password) -> { access_token, token_type }
- GET /auth/me (Bearer)
- POST /complaints (Bearer) { title,description,category,department,isAnonymous }
- GET /complaints?status_filter=...
- GET /complaints/:id
- PATCH /complaints/:id/status?new_status=...
- POST /complaints/:id/responses { content } (admin only)
- POST /complaints/:id/feedback { rating, comment } (owner only)

Local development tips

- Start backend first on http://localhost:8787, then run the frontend dev server.
- If pointing the frontend at a local backend, ensure the API base ends with /api (e.g. http://localhost:8787/api). Update src/lib/api.ts accordingly.

More info

- Backend details: backend/README.md
