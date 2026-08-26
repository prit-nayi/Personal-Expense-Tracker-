from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.base import *  # noqa
from app.db.seed import seed_default_categories
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto create database tables on startup if not present
    Base.metadata.create_all(bind=engine)
    # Seed default system categories
    db = SessionLocal()
    try:
        seed_default_categories(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Custom validation error handler returning string detail and sanitized JSON serializable errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = []
    clean_errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []) if l != "body")
        msg = str(err.get("msg", "Invalid value"))
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        messages.append(f"{loc}: {msg}" if loc else msg)
        clean_errors.append({
            "loc": list(err.get("loc", [])),
            "msg": msg,
            "type": str(err.get("type", "validation_error"))
        })
    detail_str = "; ".join(messages) if messages else "Invalid input data."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail_str, "errors": clean_errors},
    )

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "ok"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
