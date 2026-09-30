import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from api.courses import router as courses_router
from api.users import router as users_router
from database import engine
from api.auth import router as auth_router
from api.documents import router as documents_router
from api.search import router as search_router
from api.tutor import router as tutor_router
app = FastAPI()

configured_frontends = [
    origin.strip()
    for origin in os.getenv("FRONTEND_URL", "").split(",")
    if origin.strip()
]

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *configured_frontends,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(tutor_router)

@app.get("/")
def root():
    return {"message": "StudyAI API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

    return {"database": result.scalar()}
