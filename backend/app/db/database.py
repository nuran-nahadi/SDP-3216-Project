from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
from app.core.config import settings


# Use database_url property which handles both Supabase and direct PostgreSQL
DATABASE_URL = settings.database_url

# Establish a connection to the PostgreSQL database
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Verify connections before use
    pool_recycle=300,        # Recycle connections every 5 minutes
    pool_size=5,             # Number of connections to maintain
    max_overflow=10,         # Max connections beyond pool_size
    pool_timeout=30,         # Timeout for getting connection from pool
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)

print(DATABASE_URL)

Base = declarative_base()
Base.metadata.create_all(engine)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
