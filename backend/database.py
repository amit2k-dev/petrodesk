import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Humne yahan 'os.getenv' ka use kiya hai. 
# Ab aapko code baar-baar badalne ki zaroorat nahi padegi.
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3307/petrol-pump-system")

# pool_pre_ping=True: Ye server disconnect hone par connection ko check karta hai
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True, 
    pool_size=10, 
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback() # Agar error aaye toh transaction rollback kar de
        raise
    finally:
        db.close()