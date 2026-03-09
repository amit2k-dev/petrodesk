import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Render mein DATABASE_URL set hona zaroori hai
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# pool_pre_ping database connectivity issues ko handle karta hai
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True,
    connect_args={"sslmode": "require"} 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
