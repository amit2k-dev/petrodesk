from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ye ek 'petrodesk.db' naam ki file banayega
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:helloamit%402k20@db.hapusnwgdvhshwxnkopt.supabase.co:5432/postgres"

# SQLite engine setup
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

