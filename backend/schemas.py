from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

# --- 1. LOGIN ---
class LoginRequest(BaseModel):
    username: str
    password: str

class ClientCreate(BaseModel):
    username: str
    password: str
    pump_name: str
    role: str = "admin" # Default role admin set kar do 

# --- 2. SALE SCHEMAS ---
class SaleCreate(BaseModel):
    date: date  # 'str' ki jagah 'date' best hai
    nozzle: str
    opening: float
    closing: float
    testing: float
    rate: float

    model_config = ConfigDict(from_attributes=True)

# --- 3. STAFF SHIFT SCHEMAS ---
class StaffShiftCreate(BaseModel):
    date: date
    shift: str
    salesman_name: str
    nozzle: str
    opening_reading: float
    closing_reading: float
    rate: float
    online_payment: float = 0.0
    cash_payment: float = 0.0
    otp_payment: float = 0.0

# --- 4. HR & EMPLOYEE SCHEMAS ---
class EmployeeCreate(BaseModel):
    name: str
    base_salary: float
    shift: str
    joining_date: date # Frontend se seedha ISO format bhejein

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    base_salary: Optional[float] = None
    shift: Optional[str] = None
    status: Optional[str] = None
    joining_date: Optional[date] = None
    leave_date: Optional[date] = None

class EmployeeOut(BaseModel):
    id: int
    name: str
    base_salary: float
    shift: str
    joining_date: date
    status: str
    leave_date: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)

# --- 5. ADVANCE & ATTENDANCE ---
class AdvanceCreate(BaseModel):
    employee_id: int
    amount: float
    date: date
    remarks: Optional[str] = None

class AttendanceCreate(BaseModel):
    employee_id: int
    date: date
    status: str

    model_config = ConfigDict(from_attributes=True)

# --- 6. FUEL SETTING ---
class FuelSettingUpdate(BaseModel):
    petrol_rate: float
    diesel_rate: float