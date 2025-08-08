# Test Run Log

user_problem_statement: Add backend functionality into a separate folder at the root. use mongodb add authentication and other features present at the repo

summary_of_changes:
- Implemented FastAPI backend under /app/backend
- Added JWT-based authentication (register, login, me)
- Added complaints CRUD-like endpoints (create, list, get, update status, add response, add feedback)
- Configured MongoDB via backend/.env using provided Mongo Atlas cluster with database name university-complaint-box
- Ensured all API routes are prefixed with /api
- Used UUIDs for all IDs (no Mongo ObjectId exposure)

api_contracts:
- POST /api/auth/register {name,email,password,role,department?,studentId?} -> {access_token}
- POST /api/auth/login (form-data: username=email, password) -> {access_token}
- GET /api/auth/me (Bearer) -> User
- POST /api/complaints (Bearer) {title,description,category,department,isAnonymous} -> Complaint
- GET /api/complaints (Bearer) [?status_filter] -> Complaint[] (admin: all, student: own)
- GET /api/complaints/{id} (Bearer) -> Complaint
- PATCH /api/complaints/{id}/status (Admin Bearer) new_status=query|string one of [pending,under-review,in-progress,resolved,rejected] -> Complaint
- POST /api/complaints/{id}/responses (Admin Bearer) {content} -> Complaint
- POST /api/complaints/{id}/feedback (Owner Bearer) {rating,comment} -> Complaint

backend_env:
- backend/.env contains MONGO_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES

Testing Protocol:
- Backend first. Frontend hookup later per user.
- Validate health: GET /api/health -> {status:"ok"}
- Register student, login, create complaint, list own complaints
- Register admin, login, update status, add response
- Add feedback from student
- Check authorization failures for improper access

Incorporate User Feedback:
- Will adjust permissions/fields per user guidance.