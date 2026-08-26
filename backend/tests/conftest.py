import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.session import Base, get_db
from app.db.seed import seed_default_categories
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_expense_tracker.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_default_categories(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def auth_headers(client):
    # Register and login a default test user
    email = "testuser@example.com"
    password = "password123"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Test User",
        "currency_code": "USD"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
