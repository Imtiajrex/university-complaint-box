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
		allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
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

export default app;

// Start server when executed under Bun
const port = Number(process.env.PORT || 8787);
// @ts-ignore - Bun global exists when running under Bun
if (typeof Bun !== "undefined" && (Bun as any)?.serve) {
	// @ts-ignore - types provided by @types/bun in devDependencies
	Bun.serve({ port, fetch: app.fetch });
	console.log(`API listening on http://localhost:${port}`);
}
