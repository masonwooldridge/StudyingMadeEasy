from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from api.courses import router as courses_router
from api.users import router as users_router
from database import engine
from api.auth import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)

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