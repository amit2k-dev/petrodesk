import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Render mein humne jo DATABASE_URL set kiya hai, ye wahan se link lega
# Iske liye aapko Render ke Environment Variables mein 
# KEY: DATABASE_URL 
# VALUE: [Supabase connection string] daalna hoga
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

# PostgreSQL engine setup
# connect_args={'sslmode': 'require'} Supabase ke liye zaroori hota hai
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"sslmode": "require"}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Database session hasil karne ke liye helper function
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
