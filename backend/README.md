Backend API (Hono + MongoDB)

Setup

- Copy .env.example to .env and fill values.
- Install deps: bun install

Run

- Dev: bun run dev (serves on http://localhost:8787)
- Start: bun run start

Important env

- SECRET_KEY: JWT secret
- MONGO_URL: Mongo connection string (must include DB name)
- ACCESS_TOKEN_EXPIRE_MINUTES: default 60
- REACT_APP_BACKEND_URL: for frontend, e.g. http://localhost:8787/api

Endpoints (prefix /api)

- GET /health -> { status: 'ok' }
- POST /auth/register { name,email,password,role,department?,studentId? }
  -> { access_token, token_type }
- POST /auth/login (x-www-form-urlencoded: username, password)
  -> { access_token, token_type }
- GET /auth/me (Bearer token)
- POST /complaints (Bearer) { title,description,category,department,isAnonymous }
- GET /complaints?status_filter=...
- GET /complaints/:id
- PATCH /complaints/:id/status?new_status=...
- POST /complaints/:id/responses { content } (admin only)
- POST /complaints/:id/feedback { rating, comment } (owner only)
