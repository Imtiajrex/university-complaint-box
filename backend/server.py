import os
import uuid
from datetime import datetime, timedelta
from typing import List, Literal, Optional
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Constants and settings
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))
MONGO_URL = os.getenv('MONGO_URL')

if not MONGO_URL:
    raise RuntimeError('MONGO_URL not found in environment. Please set it in backend/.env')
if not SECRET_KEY:
    raise RuntimeError('SECRET_KEY not found in environment. Please set it in backend/.env')

# Database setup
client: Optional[AsyncIOMotorClient] = None
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan handler to manage startup/shutdown without deprecated on_event."""
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    # Extract DB name from URI path
    path = MONGO_URL.split('/')[-1]
    db_name = path.split('?')[0] if path else None
    if not db_name:
        raise RuntimeError('Database name not found in MONGO_URL. Please include it in the URI.')
    db = client[db_name]

    # Ensure indexes
    await db.users.create_index('email', unique=True)
    await db.complaints.create_index('studentId')
    await db.complaints.create_index('createdAt')

    try:
        yield
    finally:
        if client:
            client.close()


# Initialize FastAPI app with lifespan
app = FastAPI(title='University Complaint Box API', version='1.0.0', lifespan=lifespan)

# CORS (allow all for now; adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Security utilities
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/login')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# (Startup/shutdown handled by lifespan above)


# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Literal['student', 'admin']
    department: Optional[str] = None
    studentId: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserOut(UserBase):
    id: str


class UserInDB(UserBase):
    id: str
    password_hash: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


ComplaintStatus = Literal['pending', 'under-review', 'in-progress', 'resolved', 'rejected']
ComplaintCategory = Literal['academic', 'administrative', 'facilities', 'technical', 'other']
Department = Literal['computer-science', 'engineering', 'business', 'arts', 'sciences', 'student-affairs', 'facilities-management', 'it-services', 'other']


class ComplaintResponse(BaseModel):
    id: str
    content: str
    createdAt: datetime
    adminName: str
    adminId: str


class ComplaintFeedback(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str


class ComplaintBase(BaseModel):
    title: str
    description: str
    category: ComplaintCategory
    department: Department
    isAnonymous: bool = False


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintOut(ComplaintBase):
    id: str
    status: ComplaintStatus
    createdAt: datetime
    updatedAt: datetime
    studentId: str
    studentName: Optional[str]
    responses: List[ComplaintResponse]
    feedback: Optional[ComplaintFeedback] = None


# Helper serialization

def serialize_user(doc: dict) -> UserOut:
    return UserOut(
        id=doc['id'],
        name=doc['name'],
        email=doc['email'],
        role=doc['role'],
        department=doc.get('department'),
        studentId=doc.get('studentId'),
    )


def serialize_complaint(doc: dict) -> ComplaintOut:
    return ComplaintOut(
        id=doc['id'],
        title=doc['title'],
        description=doc['description'],
        category=doc['category'],
        department=doc['department'],
        isAnonymous=doc.get('isAnonymous', False),
        status=doc['status'],
        createdAt=doc['createdAt'],
        updatedAt=doc['updatedAt'],
        studentId=doc['studentId'],
        studentName=doc.get('studentName'),
        responses=[ComplaintResponse(**r) for r in doc.get('responses', [])],
        feedback=ComplaintFeedback(**doc['feedback']) if doc.get('feedback') else None,
    )


async def get_user_by_id(user_id: str) -> Optional[dict]:
    return await db.users.find_one({'id': user_id})


async def get_user_by_email(email: str) -> Optional[dict]:
    return await db.users.find_one({'email': email})


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get('sub')
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user_doc = await get_user_by_id(user_id)
    if user_doc is None:
        raise credentials_exception
    return serialize_user(user_doc)


async def require_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Admin privileges required')
    return current_user


# Routes - Auth
@app.post('/api/auth/register', response_model=Token)
async def register(user_in: UserCreate):
    existing = await get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail='User already exists')

    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id,
        'name': user_in.name,
        'email': user_in.email,
        'role': user_in.role,
        'department': user_in.department,
        'studentId': user_in.studentId,
        'password_hash': get_password_hash(user_in.password),
    }
    await db.users.insert_one(user_doc)

    access_token = create_access_token(data={'sub': user_id})
    return Token(access_token=access_token)


@app.post('/api/auth/login', response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm has username and password fields
    user_doc = await get_user_by_email(form_data.username)
    if not user_doc or not verify_password(form_data.password, user_doc['password_hash']):
        raise HTTPException(status_code=400, detail='Incorrect email or password')

    access_token = create_access_token(data={'sub': user_doc['id']})
    return Token(access_token=access_token)


@app.get('/api/auth/me', response_model=UserOut)
async def me(current_user: UserOut = Depends(get_current_user)):
    return current_user


# Routes - Complaints
@app.post('/api/complaints', response_model=ComplaintOut)
async def create_complaint(body: ComplaintCreate, current_user: UserOut = Depends(get_current_user)):
    now = datetime.utcnow()
    comp_id = str(uuid.uuid4())
    doc = {
        'id': comp_id,
        'title': body.title,
        'description': body.description,
        'category': body.category,
        'department': body.department,
        'isAnonymous': body.isAnonymous,
        'status': 'pending',
        'createdAt': now,
        'updatedAt': now,
        'studentId': current_user.id,
        'studentName': None if body.isAnonymous else current_user.name,
        'responses': [],
        'feedback': None,
    }
    await db.complaints.insert_one(doc)
    return serialize_complaint(doc)


@app.get('/api/complaints', response_model=List[ComplaintOut])
async def list_complaints(
    status_filter: Optional[ComplaintStatus] = None,
    current_user: UserOut = Depends(get_current_user),
):
    query = {}
    if current_user.role != 'admin':
        query['studentId'] = current_user.id
    if status_filter:
        query['status'] = status_filter

    cursor = db.complaints.find(query).sort('createdAt', -1)
    results = [serialize_complaint(doc) async for doc in cursor]
    return results


@app.get('/api/complaints/{complaint_id}', response_model=ComplaintOut)
async def get_complaint(complaint_id: str, current_user: UserOut = Depends(get_current_user)):
    doc = await db.complaints.find_one({'id': complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail='Complaint not found')
    if current_user.role != 'admin' and doc['studentId'] != current_user.id:
        raise HTTPException(status_code=403, detail='Not authorized to view this complaint')
    return serialize_complaint(doc)


@app.patch('/api/complaints/{complaint_id}/status', response_model=ComplaintOut)
async def update_status(
    complaint_id: str,
    new_status: ComplaintStatus,
    admin_user: UserOut = Depends(require_admin),
):
    now = datetime.utcnow()
    res = await db.complaints.find_one_and_update(
        {'id': complaint_id},
        {'$set': {'status': new_status, 'updatedAt': now}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail='Complaint not found')
    return serialize_complaint(res)


class ResponseIn(BaseModel):
    content: str


@app.post('/api/complaints/{complaint_id}/responses', response_model=ComplaintOut)
async def add_response(
    complaint_id: str,
    body: ResponseIn,
    admin_user: UserOut = Depends(require_admin),
):
    now = datetime.utcnow()
    response_doc = {
        'id': str(uuid.uuid4()),
        'content': body.content,
        'createdAt': now,
        'adminName': admin_user.name,
        'adminId': admin_user.id,
    }
    res = await db.complaints.find_one_and_update(
        {'id': complaint_id},
        {'$set': {'updatedAt': now}, '$push': {'responses': response_doc}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail='Complaint not found')
    return serialize_complaint(res)


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str


@app.post('/api/complaints/{complaint_id}/feedback', response_model=ComplaintOut)
async def add_feedback(
    complaint_id: str,
    body: FeedbackIn,
    current_user: UserOut = Depends(get_current_user),
):
    now = datetime.utcnow()
    doc = await db.complaints.find_one({'id': complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail='Complaint not found')
    if doc['studentId'] != current_user.id:
        raise HTTPException(status_code=403, detail='Only the complaint owner can add feedback')

    res = await db.complaints.find_one_and_update(
        {'id': complaint_id},
        {'$set': {'feedback': {'rating': body.rating, 'comment': body.comment}, 'updatedAt': now}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail='Complaint not found after update')
    return serialize_complaint(res)


# Health check
@app.get('/api/health')
async def health():
    return {"status": "ok"}