Backend API (Hono + MongoDB)

Quick start

- Copy .env.example to .env and fill values
- Install deps: bun install
- Dev: bun run dev (serves on http://localhost:8787)
- Start: bun run start

Environment

- SECRET_KEY: JWT secret (required)
- MONGO_URL: Mongo connection string including DB name (required)
- ACCESS_TOKEN_EXPIRE_MINUTES: default 60
- REACT_APP_BACKEND_URL: frontend base, e.g. http://localhost:8787/api

Base URL and auth

- Base URL: http://localhost:8787/api
- Auth: Bearer JWT via Authorization: Bearer <token>
- Obtain token from POST /auth/register or POST /auth/login

Core types (enums)

- Role: student | admin
- ComplaintStatus: pending | under-review | in-progress | resolved | rejected
- ComplaintCategory: academic | administrative | facilities | technical | other
- Department: computer-science | engineering | business | arts | sciences | student-affairs | facilities-management | it-services | other

Health

- GET /health
  - Auth: none
  - 200: { status: "ok" }

Auth

- POST /auth/register

  - Auth: none
  - Body (JSON): { name, email, password, role, department?, studentId? }
  - 200: { access_token, token_type: "bearer" }
  - 400: { detail }
  - Notes: role must be "student" or "admin". Typically, admins are created via the admin endpoints below.
  - Example:
    curl -X POST "$API/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"name":"Alice","email":"alice@example.com","password":"pass","role":"student","department":"computer-science","studentId":"S123"}'

- POST /auth/login

  - Auth: none
  - Body (form): username, password (application/x-www-form-urlencoded)
  - 200: { access_token, token_type: "bearer" }
  - 400: { detail: "Incorrect email or password" }
  - Example:
    curl -X POST "$API/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=alice@example.com&password=pass"

- GET /auth/me
  - Auth: Bearer
  - 200: { id, name, email, role, department?, studentId? }
  - 401: { detail }
  - Example:
    curl -H "Authorization: Bearer $TOKEN" "$API/auth/me"

Complaints

- POST /complaints

  - Auth: Bearer (student or admin)
  - Body (JSON): { title, description, category, department, isAnonymous? }
  - 200: Complaint
  - 400: { detail }
  - Example:
    curl -X POST "$API/complaints" \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"title":"WiFi issue","description":"Slow in lab","category":"technical","department":"it-services","isAnonymous":false}'

- GET /complaints?status_filter=<ComplaintStatus>

  - Auth: Bearer
  - Behavior: students see only their own complaints; admins see all
  - 200: Complaint[] (sorted by createdAt desc)
  - Example:
    curl -H "Authorization: Bearer $TOKEN" "$API/complaints?status_filter=pending"

- GET /complaints/:id

  - Auth: Bearer
  - Behavior: owner or admin only
  - 200: Complaint
  - 403/404/401 on errors

- PATCH /complaints/:id/status?new_status=<ComplaintStatus>

  - Auth: Bearer (admin only)
  - 200: Updated Complaint
  - 400 if new_status missing, 404 if not found
  - Example:
    curl -X PATCH -H "Authorization: Bearer $TOKEN" "$API/complaints/COMPLAINT_ID/status?new_status=under-review"

- POST /complaints/:id/responses

  - Auth: Bearer (admin only)
  - Body (JSON): { content }
  - 200: Updated Complaint (response appended)
  - 400/401/403/404 on errors

- POST /complaints/:id/feedback
  - Auth: Bearer (owner only)
  - Body (JSON): { rating: 1..5, comment }
  - 200: Updated Complaint
  - 400 invalid feedback, 403 if not owner, 404 if not found

Admin management

- GET /admins

  - Auth: Bearer (admin)
  - 200: Admin[]

- POST /admins

  - Auth: Bearer (admin)
  - Body (JSON): { name, email, password, department? }
  - 201: { id, name, email, role, department? }
  - 400 if user already exists or missing fields

- PATCH /admins/:id

  - Auth: Bearer (admin)
  - Body (JSON): { name?, email?, department?, password? }
  - 200: Updated admin (without password_hash)
  - 404 if not found

- DELETE /admins/:id
  - Auth: Bearer (admin)
  - 200: { ok: true }
  - 400: deleting self or last remaining admin
  - 404: not found

Student management

- GET /students?q=<query>&department=<dept|all>

  - Auth: Bearer (admin)
  - 200: Student[]
  - Notes: q matches name/email/studentId (case-insensitive). department optional; use "all" for no filter.

- DELETE /students/:id
  - Auth: Bearer (admin)
  - 200: { ok: true }
  - 404: not found; 400: if target is not a student

Data models (response shape)

- Complaint
  - {
    id, title, description, category, department, isAnonymous,
    status, createdAt, updatedAt, studentId, studentName?,
    responses: [{ id, content, createdAt, adminName, adminId }],
    feedback: { rating, comment } | null
    }

Tips

- Set env var for convenience in a shell: export API="http://localhost:8787/api"; export TOKEN="<jwt>"
- Dates are ISO strings in JSON.

Interactive API docs

- Swagger UI: http://localhost:8787/api/docs
- OpenAPI JSON: http://localhost:8787/api/openapi.json
