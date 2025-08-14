import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { sign, verify } from "jsonwebtoken";
import { Collection, Db, MongoClient } from "mongodb";

dotenv.config();

// Environment
const SECRET_KEY = process.env.SECRET_KEY || "";
const ACCESS_TOKEN_EXPIRE_MINUTES = Number(
	process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "60"
);
const MONGO_URL = process.env.MONGO_URL || "";
if (!SECRET_KEY) throw new Error("SECRET_KEY not set in backend/.env");
if (!MONGO_URL) throw new Error("MONGO_URL not set in backend/.env");

// Types
type Role = "student" | "admin";
type ComplaintStatus =
	| "pending"
	| "under-review"
	| "in-progress"
	| "resolved"
	| "rejected";
type ComplaintCategory =
	| "academic"
	| "administrative"
	| "facilities"
	| "technical"
	| "other";
type Department =
	| "computer-science"
	| "engineering"
	| "business"
	| "arts"
	| "sciences"
	| "student-affairs"
	| "facilities-management"
	| "it-services"
	| "other";

type UserDoc = {
	id: string;
	name: string;
	email: string;
	role: Role;
	department?: string | null;
	studentId?: string | null;
	password_hash: string;
};

type UserOut = Omit<UserDoc, "password_hash">;

type ComplaintResponse = {
	id: string;
	content: string;
	createdAt: Date;
	adminName: string;
	adminId: string;
};

type ComplaintFeedback = {
	rating: number;
	comment: string;
} | null;

type ComplaintDoc = {
	id: string;
	title: string;
	description: string;
	category: ComplaintCategory;
	department: Department;
	isAnonymous: boolean;
	status: ComplaintStatus;
	createdAt: Date;
	updatedAt: Date;
	studentId: string;
	studentName?: string | null;
	responses: ComplaintResponse[];
	feedback: ComplaintFeedback;
};

type ComplaintOut = ComplaintDoc;

// Mongo client singleton
let client: MongoClient | null = null;
let db: Db;
let usersCol: Collection<UserDoc>;
let complaintsCol: Collection<ComplaintDoc>;

async function getDb(): Promise<Db> {
	if (!client) {
		client = new MongoClient(MONGO_URL);
		await client.connect();
		const url = new URL(MONGO_URL);
		const dbName = (url.pathname || "/").replace(/^\//, "");
		if (!dbName) throw new Error("Database name missing in MONGO_URL");
		db = client.db(dbName);
		usersCol = db.collection<UserDoc>("users");
		complaintsCol = db.collection<ComplaintDoc>("complaints");
		// Indexes
		await usersCol.createIndex({ email: 1 }, { unique: true });
		await complaintsCol.createIndex({ studentId: 1 });
		await complaintsCol.createIndex({ createdAt: -1 });
	}
	return db;
}

// Helpers
const createAccessToken = (sub: string) => {
	const expSeconds =
		Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRE_MINUTES * 60;
	return sign({ sub, exp: expSeconds }, SECRET_KEY);
};

const getCurrentUser = async (c: any): Promise<UserOut | null> => {
	const auth = c.req.header("authorization") || "";
	const m = auth.match(/^Bearer\s+(.+)$/i);
	if (!m) return null;
	try {
		const payload = verify(m[1], SECRET_KEY) as any;
		const sub = payload?.sub;
		if (!sub) return null;
		await getDb();
		const user = await usersCol.findOne(
			{ id: String(sub) },
			{ projection: { password_hash: 0 } as any }
		);
		return (user as any) || null;
	} catch {
		return null;
	}
};

const requireAdmin = async (
	c: any
): Promise<UserOut | "unauthorized" | "forbidden"> => {
	const u = await getCurrentUser(c);
	if (!u) return "unauthorized";
	if (u.role !== "admin") return "forbidden";
	return u;
};

// App
const app = new Hono();
app.use(
	"/*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		credentials: true,
	})
);

// Health
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Auth: Register
app.post("/api/auth/register", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ detail: "Invalid JSON" }, 400);
	const { name, email, password, role, department, studentId } = body as {
		name: string;
		email: string;
		password: string;
		role: Role;
		department?: string;
		studentId?: string;
	};
	if (!name || !email || !password || !role)
		return c.json({ detail: "Missing required fields" }, 400);
	await getDb();
	const existing = await usersCol.findOne({ email });
	if (existing) return c.json({ detail: "User already exists" }, 400);
	const id = crypto.randomUUID();
	const password_hash = bcrypt.hashSync(password, 10);
	const user: UserDoc = {
		id,
		name,
		email,
		role,
		department: department ?? null,
		studentId: studentId ?? null,
		password_hash,
	};
	await usersCol.insertOne(user);
	const access_token = createAccessToken(id);
	return c.json({ access_token, token_type: "bearer" });
});

// Auth: Login (form-urlencoded)
app.post("/api/auth/login", async (c) => {
	const form = await c.req.parseBody();
	const username = String((form as any)?.username || "");
	const password = String((form as any)?.password || "");
	await getDb();
	const user = await usersCol.findOne({ email: username });
	if (!user || !bcrypt.compareSync(password, user.password_hash)) {
		return c.json({ detail: "Incorrect email or password" }, 400);
	}
	const access_token = createAccessToken(user.id);
	return c.json({ access_token, token_type: "bearer" });
});

// Auth: Me
app.get("/api/auth/me", async (c) => {
	const u = await getCurrentUser(c);
	if (!u) return c.json({ detail: "Could not validate credentials" }, 401);
	return c.json(u);
});

// Complaints: Create
app.post("/api/complaints", async (c) => {
	const u = await getCurrentUser(c);
	if (!u) return c.json({ detail: "Could not validate credentials" }, 401);
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ detail: "Invalid JSON" }, 400);
	const { title, description, category, department, isAnonymous } = body as {
		title: string;
		description: string;
		category: ComplaintCategory;
		department: Department;
		isAnonymous?: boolean;
	};
	if (!title || !description || !category || !department)
		return c.json({ detail: "Missing required fields" }, 400);

	await getDb();
	const now = new Date();
	const id = crypto.randomUUID();
	const doc: ComplaintDoc = {
		id,
		title,
		description,
		category,
		department,
		isAnonymous: !!isAnonymous,
		status: "pending",
		createdAt: now,
		updatedAt: now,
		studentId: u.id,
		studentName: isAnonymous ? null : u.name,
		responses: [],
		feedback: null,
	};
	await complaintsCol.insertOne(doc);
	return c.json(doc);
});

// Complaints: List
app.get("/api/complaints", async (c) => {
	const u = await getCurrentUser(c);
	if (!u) return c.json({ detail: "Could not validate credentials" }, 401);
	const status_filter = c.req.query("status_filter") as
		| ComplaintStatus
		| undefined;
	await getDb();
	const query: any = {};
	if (u.role !== "admin") query.studentId = u.id;
	if (status_filter) query.status = status_filter;
	const items = await complaintsCol
		.find(query)
		.sort({ createdAt: -1 })
		.toArray();
	return c.json(items);
});

// Complaints: Get by id
app.get("/api/complaints/:id", async (c) => {
	const u = await getCurrentUser(c);
	if (!u) return c.json({ detail: "Could not validate credentials" }, 401);
	const id = c.req.param("id");
	await getDb();
	const doc = await complaintsCol.findOne({ id });
	if (!doc) return c.json({ detail: "Complaint not found" }, 404);
	if (u.role !== "admin" && doc.studentId !== u.id)
		return c.json({ detail: "Not authorized to view this complaint" }, 403);
	return c.json(doc);
});

// Complaints: Update status
app.patch("/api/complaints/:id/status", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const id = c.req.param("id");
	const new_status = c.req.query("new_status") as ComplaintStatus | undefined;
	if (!new_status) return c.json({ detail: "new_status is required" }, 400);
	await getDb();
	const now = new Date();
	const res = await complaintsCol.findOneAndUpdate(
		{ id },
		{ $set: { status: new_status, updatedAt: now } },
		{ returnDocument: "after" }
	);
	const doc = res;
	if (!doc) return c.json({ detail: "Complaint not found" }, 404);
	return c.json(doc);
});

// Complaints: Add response
app.post("/api/complaints/:id/responses", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const id = c.req.param("id");
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ detail: "Invalid JSON" }, 400);
	const { content } = body as { content: string };
	if (!content) return c.json({ detail: "content is required" }, 400);
	await getDb();
	const now = new Date();
	const response: ComplaintResponse = {
		id: crypto.randomUUID(),
		content,
		createdAt: now,
		adminName: admin.name,
		adminId: admin.id,
	};
	const res = await complaintsCol.findOneAndUpdate(
		{ id },
		{ $push: { responses: response }, $set: { updatedAt: now } },
		{ returnDocument: "after" }
	);
	const doc = res;
	if (!doc) return c.json({ detail: "Complaint not found" }, 404);
	return c.json(doc);
});

// Complaints: Add feedback
app.post("/api/complaints/:id/feedback", async (c) => {
	const u = await getCurrentUser(c);
	if (!u) return c.json({ detail: "Could not validate credentials" }, 401);
	const id = c.req.param("id");
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ detail: "Invalid JSON" }, 400);
	const { rating, comment } = body as { rating: number; comment: string };
	if (typeof rating !== "number" || rating < 1 || rating > 5 || !comment)
		return c.json({ detail: "Invalid feedback" }, 400);
	await getDb();
	const comp = await complaintsCol.findOne({ id });
	if (!comp) return c.json({ detail: "Complaint not found" }, 404);
	if (comp.studentId !== u.id)
		return c.json({ detail: "Only the complaint owner can add feedback" }, 403);
	const now = new Date();
	const res = await complaintsCol.findOneAndUpdate(
		{ id },
		{ $set: { feedback: { rating, comment }, updatedAt: now } },
		{ returnDocument: "after" }
	);
	const doc = res;
	if (!doc) return c.json({ detail: "Complaint not found after update" }, 404);
	return c.json(doc);
});

// ----------------------
// Admin management APIs
// ----------------------

// List admins
app.get("/api/admins", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	await getDb();
	const admins = await usersCol
		.find({ role: "admin" }, { projection: { password_hash: 0 } as any })
		.sort({ name: 1 })
		.toArray();
	return c.json(admins);
});

// Create admin
app.post("/api/admins", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ detail: "Invalid JSON" }, 400);
	const { name, email, password, department } = body as {
		name: string;
		email: string;
		password: string;
		department?: string | null;
	};
	if (!name || !email || !password)
		return c.json({ detail: "Missing required fields" }, 400);
	await getDb();
	const existing = await usersCol.findOne({ email });
	if (existing)
		return c.json({ detail: "User with this email already exists" }, 400);
	const id = crypto.randomUUID();
	const password_hash = bcrypt.hashSync(password, 10);
	const doc: UserDoc = {
		id,
		name,
		email,
		role: "admin",
		department: department ?? null,
		studentId: null,
		password_hash,
	};
	await usersCol.insertOne(doc);
	const out: UserOut = {
		id: doc.id,
		name: doc.name,
		email: doc.email,
		role: doc.role,
		department: doc.department ?? undefined,
		studentId: undefined,
	} as any;
	return c.json(out, 201);
});

// Update admin (name/email/department, optional password)
app.patch("/api/admins/:id", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const id = c.req.param("id");
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ detail: "Invalid JSON" }, 400);
	const { name, email, department, password } = body as {
		name?: string;
		email?: string;
		department?: string | null;
		password?: string;
	};
	await getDb();
	const updates: any = {};
	if (name !== undefined) updates.name = name;
	if (email !== undefined) updates.email = email;
	if (department !== undefined) updates.department = department;
	if (password) updates.password_hash = bcrypt.hashSync(password, 10);
	if (Object.keys(updates).length === 0)
		return c.json({ detail: "No updates provided" }, 400);
	const result = await usersCol.findOneAndUpdate(
		{ id, role: "admin" },
		{ $set: updates },
		{ returnDocument: "after", projection: { password_hash: 0 } as any }
	);
	const doc = result as any;
	if (!doc) return c.json({ detail: "Admin not found" }, 404);
	return c.json(doc);
});

// Delete admin
app.delete("/api/admins/:id", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const id = c.req.param("id");
	await getDb();
	// prevent deleting self
	if (id === admin.id)
		return c.json({ detail: "You cannot delete your own admin account" }, 400);
	// prevent deleting last admin
	const adminCount = await usersCol.countDocuments({ role: "admin" });
	if (adminCount <= 1)
		return c.json({ detail: "Cannot delete the last remaining admin" }, 400);
	const res = await usersCol.deleteOne({ id, role: "admin" });
	if (!res.deletedCount) return c.json({ detail: "Admin not found" }, 404);
	return c.json({ ok: true });
});

export default app;

// ------------------------
// Student management APIs
// ------------------------

// List students with optional filters
app.get("/api/students", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const q = (c.req.query("q") || "").trim();
	const department = (c.req.query("department") || "").trim();
	await getDb();
	const query: any = { role: "student" };
	if (q) {
		const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
		query.$or = [
			{ name: { $regex: regex } },
			{ email: { $regex: regex } },
			{ studentId: { $regex: regex } },
		];
	}
	if (department && department !== "all") {
		query.department = department;
	}
	const students = await usersCol
		.find(query, { projection: { password_hash: 0 } as any })
		.sort({ name: 1 })
		.toArray();
	return c.json(students);
});

// Delete student
app.delete("/api/students/:id", async (c) => {
	const admin = await requireAdmin(c);
	if (admin === "unauthorized")
		return c.json({ detail: "Could not validate credentials" }, 401);
	if (admin === "forbidden")
		return c.json({ detail: "Admin privileges required" }, 403);
	const id = c.req.param("id");
	await getDb();
	const target = await usersCol.findOne({ id });
	if (!target) return c.json({ detail: "User not found" }, 404);
	if (target.role !== "student")
		return c.json({ detail: "Only students can be deleted here" }, 400);
	const res = await usersCol.deleteOne({ id, role: "student" });
	if (!res.deletedCount) return c.json({ detail: "Student not found" }, 404);
	return c.json({ ok: true });
});

// ------------------------
// OpenAPI + Swagger UI
// ------------------------
// Minimal, hand-written OpenAPI 3.0 spec that covers all routes.
const openapiSpec: any = {
	openapi: "3.0.3",
	info: {
		title: "University Complaint Box API",
		version: "1.0.0",
		description:
			"REST API for authentication, complaints, and user management. Uses Bearer JWT auth.",
	},
	servers: [{ url: "http://localhost:8787" }],
	components: {
		securitySchemes: {
			bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
		},
		schemas: {
			Role: { type: "string", enum: ["student", "admin"] },
			ComplaintStatus: {
				type: "string",
				enum: [
					"pending",
					"under-review",
					"in-progress",
					"resolved",
					"rejected",
				],
			},
			ComplaintCategory: {
				type: "string",
				enum: [
					"academic",
					"administrative",
					"facilities",
					"technical",
					"other",
				],
			},
			Department: {
				type: "string",
				enum: [
					"computer-science",
					"engineering",
					"business",
					"arts",
					"sciences",
					"student-affairs",
					"facilities-management",
					"it-services",
					"other",
				],
			},
			Error: {
				type: "object",
				properties: { detail: { type: "string" } },
				required: ["detail"],
			},
			TokenResponse: {
				type: "object",
				properties: {
					access_token: { type: "string" },
					token_type: { type: "string", example: "bearer" },
				},
				required: ["access_token", "token_type"],
			},
			User: {
				type: "object",
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					email: { type: "string", format: "email" },
					role: { $ref: "#/components/schemas/Role" },
					department: { type: ["string", "null"] },
					studentId: { type: ["string", "null"] },
				},
				required: ["id", "name", "email", "role"],
			},
			ComplaintResponse: {
				type: "object",
				properties: {
					id: { type: "string" },
					content: { type: "string" },
					createdAt: { type: "string", format: "date-time" },
					adminName: { type: "string" },
					adminId: { type: "string" },
				},
				required: ["id", "content", "createdAt", "adminName", "adminId"],
			},
			ComplaintFeedback: {
				anyOf: [
					{
						type: "object",
						properties: {
							rating: { type: "integer", minimum: 1, maximum: 5 },
							comment: { type: "string" },
						},
						required: ["rating", "comment"],
					},
					{ type: "null" },
				],
			},
			Complaint: {
				type: "object",
				properties: {
					id: { type: "string" },
					title: { type: "string" },
					description: { type: "string" },
					category: { $ref: "#/components/schemas/ComplaintCategory" },
					department: { $ref: "#/components/schemas/Department" },
					isAnonymous: { type: "boolean" },
					status: { $ref: "#/components/schemas/ComplaintStatus" },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
					studentId: { type: "string" },
					studentName: { type: ["string", "null"] },
					responses: {
						type: "array",
						items: { $ref: "#/components/schemas/ComplaintResponse" },
					},
					feedback: { $ref: "#/components/schemas/ComplaintFeedback" },
				},
				required: [
					"id",
					"title",
					"description",
					"category",
					"department",
					"isAnonymous",
					"status",
					"createdAt",
					"updatedAt",
					"studentId",
					"responses",
				],
			},
			RegisterBody: {
				type: "object",
				properties: {
					name: { type: "string" },
					email: { type: "string", format: "email" },
					password: { type: "string" },
					role: { $ref: "#/components/schemas/Role" },
					department: { type: "string", nullable: true },
					studentId: { type: "string", nullable: true },
				},
				required: ["name", "email", "password", "role"],
			},
			LoginForm: {
				type: "object",
				properties: {
					username: { type: "string", format: "email" },
					password: { type: "string" },
				},
				required: ["username", "password"],
			},
			CreateComplaintBody: {
				type: "object",
				properties: {
					title: { type: "string" },
					description: { type: "string" },
					category: { $ref: "#/components/schemas/ComplaintCategory" },
					department: { $ref: "#/components/schemas/Department" },
					isAnonymous: { type: "boolean" },
				},
				required: ["title", "description", "category", "department"],
			},
			AddResponseBody: {
				type: "object",
				properties: { content: { type: "string" } },
				required: ["content"],
			},
			AddFeedbackBody: {
				type: "object",
				properties: {
					rating: { type: "integer", minimum: 1, maximum: 5 },
					comment: { type: "string" },
				},
				required: ["rating", "comment"],
			},
			CreateAdminBody: {
				type: "object",
				properties: {
					name: { type: "string" },
					email: { type: "string", format: "email" },
					password: { type: "string" },
					department: { type: "string", nullable: true },
				},
				required: ["name", "email", "password"],
			},
			UpdateAdminBody: {
				type: "object",
				properties: {
					name: { type: "string" },
					email: { type: "string", format: "email" },
					department: { type: "string", nullable: true },
					password: { type: "string" },
				},
			},
			OkResponse: {
				type: "object",
				properties: { ok: { type: "boolean", example: true } },
				required: ["ok"],
			},
		},
	},
	paths: {
		"/api/health": {
			get: {
				summary: "Health check",
				responses: {
					"200": {
						description: "OK",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: { status: { type: "string", example: "ok" } },
									required: ["status"],
								},
							},
						},
					},
				},
			},
		},
		"/api/auth/register": {
			post: {
				summary: "Register a new user",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/RegisterBody" },
						},
					},
				},
				responses: {
					"200": {
						description: "Token",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/TokenResponse" },
							},
						},
					},
					"400": {
						description: "Bad Request",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/auth/login": {
			post: {
				summary: "Login",
				requestBody: {
					required: true,
					content: {
						"application/x-www-form-urlencoded": {
							schema: { $ref: "#/components/schemas/LoginForm" },
						},
					},
				},
				responses: {
					"200": {
						description: "Token",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/TokenResponse" },
							},
						},
					},
					"400": {
						description: "Incorrect credentials",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/auth/me": {
			get: {
				summary: "Current user",
				security: [{ bearerAuth: [] }],
				responses: {
					"200": {
						description: "User",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/User" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/complaints": {
			get: {
				summary: "List complaints",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "status_filter",
						in: "query",
						schema: { $ref: "#/components/schemas/ComplaintStatus" },
					},
				],
				responses: {
					"200": {
						description: "List",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Complaint" },
								},
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
			post: {
				summary: "Create complaint",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateComplaintBody" },
						},
					},
				},
				responses: {
					"200": {
						description: "Created",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Complaint" },
							},
						},
					},
					"400": {
						description: "Bad Request",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/complaints/{id}": {
			get: {
				summary: "Get complaint by id",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: {
					"200": {
						description: "Complaint",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Complaint" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Forbidden",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/complaints/{id}/status": {
			patch: {
				summary: "Update complaint status (admin)",
				description: "Admin only",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
					{
						name: "new_status",
						in: "query",
						required: true,
						schema: { $ref: "#/components/schemas/ComplaintStatus" },
					},
				],
				responses: {
					"200": {
						description: "Updated",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Complaint" },
							},
						},
					},
					"400": {
						description: "Missing/invalid query",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/complaints/{id}/responses": {
			post: {
				summary: "Add admin response (admin)",
				description: "Admin only",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/AddResponseBody" },
						},
					},
				},
				responses: {
					"200": {
						description: "Updated complaint",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Complaint" },
							},
						},
					},
					"400": {
						description: "Invalid JSON",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/complaints/{id}/feedback": {
			post: {
				summary: "Add feedback (owner only)",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/AddFeedbackBody" },
						},
					},
				},
				responses: {
					"200": {
						description: "Updated complaint",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Complaint" },
							},
						},
					},
					"400": {
						description: "Invalid feedback",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Owner only",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/admins": {
			get: {
				summary: "List admins (admin)",
				security: [{ bearerAuth: [] }],
				responses: {
					"200": {
						description: "Admins",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/User" },
								},
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
			post: {
				summary: "Create admin (admin)",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateAdminBody" },
						},
					},
				},
				responses: {
					"201": {
						description: "Created",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/User" },
							},
						},
					},
					"400": {
						description: "Validation error/existing user",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/admins/{id}": {
			patch: {
				summary: "Update admin (admin)",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/UpdateAdminBody" },
						},
					},
				},
				responses: {
					"200": {
						description: "Updated",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/User" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
			delete: {
				summary: "Delete admin (admin)",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: {
					"200": {
						description: "Deleted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/OkResponse" },
							},
						},
					},
					"400": {
						description: "Deleting self/last admin",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/students": {
			get: {
				summary: "List students (admin)",
				security: [{ bearerAuth: [] }],
				parameters: [
					{ name: "q", in: "query", schema: { type: "string" } },
					{
						name: "department",
						in: "query",
						schema: { $ref: "#/components/schemas/Department" },
					},
				],
				responses: {
					"200": {
						description: "Students",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/User" },
								},
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/students/{id}": {
			delete: {
				summary: "Delete student (admin)",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: {
					"200": {
						description: "Deleted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/OkResponse" },
							},
						},
					},
					"400": {
						description: "Not a student",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Admin required",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description: "Not Found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
	},
};

app.get("/api/openapi.json", (c) => c.json(openapiSpec));

const swaggerHtml = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>API Docs</title>
		<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
	</head>
	<body>
		<div id="swagger-ui"></div>
		<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
		<script>
			window.ui = SwaggerUIBundle({
				url: '/api/openapi.json',
				dom_id: '#swagger-ui',
				presets: [SwaggerUIBundle.presets.apis],
				layout: 'BaseLayout',
			});
		</script>
	</body>
</html>`;

app.get("/api/docs", (c) => c.html(swaggerHtml));

// Start server when executed under Bun
const port = Number(8787);
// @ts-ignore - Bun global exists when running under Bun
if (typeof Bun !== "undefined" && (Bun as any)?.serve) {
	// @ts-ignore - types provided by @types/bun in devDependencies
	Bun.serve({ port, fetch: app.fetch });
	console.log(`API listening on http://localhost:${port}`);
}
