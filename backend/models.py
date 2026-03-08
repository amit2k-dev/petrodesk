from sqlalchemy import Column, Integer, String, Float, Date, TIMESTAMP, text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    pump_name = Column(String(255), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="User")
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class FuelSetting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    petrol_rate = Column(Float, default=0.0)
    diesel_rate = Column(Float, default=0.0)

class Tank(Base):
    __tablename__ = "tanks"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    product_type = Column(String(50))
    capacity = Column(Float)
    current_stock = Column(Float, default=0.0)

class DailySale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    date = Column(Date, nullable=False)
    nozzle = Column(String(50), nullable=False)
    opening = Column(Float, nullable=False)
    closing = Column(Float, nullable=False)
    difference = Column(Float)
    testing = Column(Float, default=0)
    rate = Column(Float, nullable=False)
    actual_sale = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class StaffShift(Base):
    __tablename__ = "staff_shifts"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    date = Column(Date, nullable=False) # Changed to Date type
    shift = Column(String(50))
    salesman_name = Column(String(100))
    nozzle = Column(String(50))
    opening_reading = Column(Float)
    closing_reading = Column(Float)
    rate = Column(Float)
    actual_sale_ltr = Column(Float)
    total_amount = Column(Float)
    online_payment = Column(Float, default=0.0)
    cash_payment = Column(Float, default=0.0)
    otp_payment = Column(Float, default=0.0)
    shortage = Column(Float, default=0.0)

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    name = Column(String(100))
    base_salary = Column(Float)
    shift = Column(String(50))
    joining_date = Column(Date)
    status = Column(String(20), default="Active")
    
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete")
    advances = relationship("SalaryAdvance", back_populates="employee", cascade="all, delete")
    salaries = relationship("SalaryRecord", back_populates="employee", cascade="all, delete")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    date = Column(Date)
    status = Column(String(20))
    employee = relationship("Employee", back_populates="attendances")

class SalaryAdvance(Base):
    __tablename__ = "salary_advances"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    remarks = Column(String(200))
    employee = relationship("Employee", back_populates="advances")

class SalaryRecord(Base):
    __tablename__ = "salary_records"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    month = Column(String(20))
    paid_up_to = Column(Date)
    present_days = Column(Float)
    base_salary = Column(Float)
    advance_taken = Column(Float)
    net_payable = Column(Float)
    status = Column(String(20), default="Paid")
    payment_date = Column(Date)
    employee = relationship("Employee", back_populates="salaries")