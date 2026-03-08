from fastapi import FastAPI, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, database, calendar
from models import Client
from database import engine, get_db
from datetime import datetime, date
from sqlalchemy import func, extract
from schemas import LoginRequest
from fastapi.responses import JSONResponse
from auth import verify_password, get_hash

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. AUTH ---
@app.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.username == credentials.username).first()
    
    if db_client and verify_password(credentials.password, db_client.password):
        return {"client_id": db_client.id, "pump_name": db_client.pump_name}
    
    raise HTTPException(status_code=401, detail="Invalid Credentials")


@app.post("/register")
def register(data: schemas.ClientCreate, db: Session = Depends(get_db)):
    hashed_pwd = get_hash(data.password)
    new_client = models.Client(
        username=data.username,
        password=hashed_pwd,
        pump_name=data.pump_name,
        role="admin"  # Hardcoded role
    )
    db.add(new_client)
    db.commit()
    return {"message": "Success"}

# --- 2. FUEL RATES ---
@app.post("/update-rates/")
async def update_fuel_rates(client_id: int, petrol: float, diesel: float, db: Session = Depends(get_db)):
    record = db.query(models.FuelSetting).filter(models.FuelSetting.client_id == client_id).first()
    if record:
        record.petrol_rate, record.diesel_rate = petrol, diesel
    else:
        db.add(models.FuelSetting(client_id=client_id, petrol_rate=petrol, diesel_rate=diesel))
    db.commit()
    return {"status": "success", "message": "Fuel rates updated"}

@app.get("/get-current-rates/")
def get_rates(client_id: int, db: Session = Depends(get_db)):
    rates = db.query(models.FuelSetting).filter(models.FuelSetting.client_id == client_id).first()
    return rates if rates else {"petrol_rate": 0.0, "diesel_rate": 90.0}

# --- 3. INVENTORY ---
@app.get("/inventory/")
def get_inventory(client_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Tank).filter(models.Tank.client_id == client_id).all()

@app.post("/update-inventory/")
def update_tank_stock(client_id: int, data: dict = Body(...), db: Session = Depends(get_db)):
    tank = db.query(models.Tank).filter(models.Tank.id == data.get('tank_id'), models.Tank.client_id == client_id).first()
    if not tank: raise HTTPException(status_code=404, detail="Tank not found")
    tank.current_stock += float(data.get('added_qty'))
    db.commit()
    return {"status": "Success", "new_stock": tank.current_stock}

# --- 4. STAFF SHIFT ---
@app.post("/add-staff-shift/")
def create_staff_shift(client_id: int, shift_data: schemas.StaffShiftCreate, db: Session = Depends(get_db)):
    actual = (shift_data.closing_reading - shift_data.opening_reading)
    new_shift = models.StaffShift(**shift_data.dict(), actual_sale_ltr=actual, total_amount=actual * shift_data.rate, client_id=client_id)
    db.add(new_shift)
    db.commit()
    return {"status": "Success"}

@app.get("/staff-history/")
def get_staff_history(client_id: int, month: int = None, year: int = None, name: str = None, date: str = None, db: Session = Depends(get_db)):
    query = db.query(models.StaffShift).filter(models.StaffShift.client_id == client_id)
    if date: query = query.filter(models.StaffShift.date == date)
    if month and year: query = query.filter(extract('month', models.StaffShift.date) == month, extract('year', models.StaffShift.date) == year)
    if name: query = query.filter(models.StaffShift.salesman_name.ilike(f"%{name}%"))
    return query.order_by(models.StaffShift.id.desc()).limit(100).all()

@app.put("/update-staff-shift/{item_id}")
async def update_shift(item_id: int, client_id: int, shift_data: schemas.StaffShiftCreate, db: Session = Depends(get_db)):
    db_shift = db.query(models.StaffShift).filter(models.StaffShift.id == item_id, models.StaffShift.client_id == client_id).first()
    if not db_shift: raise HTTPException(status_code=404, detail="Not found")
    # Update logic... (rest of your logic remains same)
    actual = (shift_data.closing_reading - shift_data.opening_reading)
    db_shift.date, db_shift.shift, db_shift.salesman_name, db_shift.nozzle = shift_data.date, shift_data.shift, shift_data.salesman_name, shift_data.nozzle
    db_shift.opening_reading, db_shift.closing_reading, db_shift.actual_sale_ltr, db_shift.rate = shift_data.opening_reading, shift_data.closing_reading, actual, shift_data.rate
    db_shift.total_amount, db_shift.online_payment, db_shift.otp_payment, db_shift.cash_payment = (actual * shift_data.rate), shift_data.online_payment, shift_data.otp_payment, shift_data.cash_payment
    db.commit()
    return {"status": "Success"}

@app.delete("/delete-staff-shift/{item_id}")
async def delete_shift(item_id: int, client_id: int, db: Session = Depends(get_db)):
    db_shift = db.query(models.StaffShift).filter(models.StaffShift.id == item_id, models.StaffShift.client_id == client_id).first()
    if not db_shift: raise HTTPException(status_code=404, detail="Not found")
    db.delete(db_shift)
    db.commit()
    return {"status": "Success"}

# --- 5. SALES ---
@app.post("/add-sale/")
def create_entry(client_id: int, sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    diff = sale.closing - sale.opening
    actual = diff - sale.testing
    total = actual * float(sale.rate)
    new_sale = models.DailySale(**sale.dict(), client_id=client_id, difference=diff, actual_sale=actual, total_amount=total)
    db.add(new_sale)
    prod = "Petrol" if "Petrol" in sale.nozzle else "Diesel"
    tank = db.query(models.Tank).filter(models.Tank.client_id == client_id, models.Tank.product_type.ilike(f"%{prod}%")).first()
    if tank: tank.current_stock -= actual
    db.commit()
    return {"status": "Success", "remaining_stock": tank.current_stock if tank else "N/A"}

@app.get("/get-sales/")
def get_all_sales(client_id: int, date: str = None, db: Session = Depends(get_db)):
    query = db.query(models.DailySale).filter(models.DailySale.client_id == client_id).order_by(models.DailySale.id.desc())
    return query.filter(models.DailySale.date == date).all() if date else query.limit(30).all()


# --- 5. SALES (UPDATE & DELETE) ---

@app.put("/update-sale/{sale_id}")
def update_sale(sale_id: int, client_id: int, sale_data: schemas.SaleCreate, db: Session = Depends(get_db)):
    db_sale = db.query(models.DailySale).filter(models.DailySale.id == sale_id, models.DailySale.client_id == client_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Stock adjustment (Purana stock wapas add karo, naya subtract karo)
    prod = "Petrol" if "Petrol" in sale_data.nozzle else "Diesel"
    tank = db.query(models.Tank).filter(models.Tank.client_id == client_id, models.Tank.product_type.ilike(f"%{prod}%")).first()
    
    if tank:
        tank.current_stock += db_sale.actual_sale # Purana wapas dala
        tank.current_stock -= (sale_data.closing - sale_data.opening - sale_data.testing) # Naya subtract kiya
        
    # Update data
    db_sale.date = sale_data.date
    db_sale.nozzle = sale_data.nozzle
    db_sale.opening = sale_data.opening
    db_sale.closing = sale_data.closing
    db_sale.testing = sale_data.testing
    db_sale.difference = sale_data.closing - sale_data.opening
    db_sale.actual_sale = db_sale.difference - sale_data.testing
    db_sale.total_amount = db_sale.actual_sale * float(sale_data.rate)
    
    db.commit()
    return {"status": "Success"}

@app.delete("/delete-sale/{sale_id}")
def delete_sale(sale_id: int, client_id: int, db: Session = Depends(get_db)):
    db_sale = db.query(models.DailySale).filter(models.DailySale.id == sale_id, models.DailySale.client_id == client_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Stock wapas add karo
    prod = "Petrol" if "Petrol" in db_sale.nozzle else "Diesel"
    tank = db.query(models.Tank).filter(models.Tank.client_id == client_id, models.Tank.product_type.ilike(f"%{prod}%")).first()
    if tank:
        tank.current_stock += db_sale.actual_sale
        
    db.delete(db_sale)
    db.commit()
    return {"status": "Success"}



# --- 6. HR & SALARY ---
@app.get("/employees/")
def get_employees(client_id: int, db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(models.Employee.client_id == client_id).all()

@app.post("/employees/")
def create_employee(client_id: int, emp: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_emp = models.Employee(**emp.dict(), client_id=client_id, status="Active")
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.put("/employees/{emp_id}")
def update_employee(emp_id: int, client_id: int, emp_data: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id, models.Employee.client_id == client_id).first()
    if not db_emp: raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update fields dynamically
    for key, value in emp_data.dict(exclude_unset=True).items():
        setattr(db_emp, key, value)
        
    db.commit()
    return db_emp

@app.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, client_id: int, db: Session = Depends(get_db)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id, models.Employee.client_id == client_id).first()
    if not db_emp: raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_emp)
    db.commit()
    return {"message": "Deleted successfully"}

@app.post("/salary-advance/")
def create_advance(client_id: int, adv: schemas.AdvanceCreate, db: Session = Depends(get_db)):
    db_adv = models.SalaryAdvance(**adv.dict(), client_id=client_id)
    db.add(db_adv)
    db.commit()
    return {"status": "success"}

# --- 7. ATTENDANCE & SALARY ---
@app.get("/attendance/history/{month_str}")
def get_attendance_history(month_str: str, client_id: int, db: Session = Depends(get_db)):
    target_year, target_month = map(int, month_str.split("-"))
    start_date, last_day = date(target_year, target_month, 1), calendar.monthrange(target_year, target_month)[1]
    history = db.query(models.Attendance.id, models.Attendance.date, models.Attendance.status, models.Employee.name).join(models.Employee).filter(models.Employee.client_id == client_id, models.Attendance.date >= start_date, models.Attendance.date <= date(target_year, target_month, last_day)).all()
    return [{"id": h[0], "date": h[1], "status": h[2], "name": h[3]} for h in history]

@app.post("/attendance/")
def mark_attendance(client_id: int, att: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Attendance).join(models.Employee).filter(models.Employee.client_id == client_id, models.Attendance.employee_id == att.employee_id, models.Attendance.date == att.date).first()
    if existing: existing.status = att.status
    else: db.add(models.Attendance(**att.dict(), client_id=client_id))
    db.commit()
    return {"message": "Success"}

@app.delete("/attendance/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    # Yahan 'models.Attendance' use karo, sirf 'Attendance' nahi
    record = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record nahi mila")
    
    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}

@app.get("/salary/report/{month_str}")
def get_salary_report(month_str: str, client_id: int, db: Session = Depends(get_db)):
    try:
        target_year, target_month = map(int, month_str.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    employees = db.query(models.Employee).filter(models.Employee.client_id == client_id).all()
    
    report = []
    for emp in employees:
        # 1. Attendance dikhane ke liye count waise hi rehne diya
        present_count = db.query(models.Attendance).filter(
            models.Attendance.employee_id == emp.id,
            extract('month', models.Attendance.date) == target_month,
            extract('year', models.Attendance.date) == target_year,
            models.Attendance.status == 'Present'
        ).count() or 0
        
        # 2. Advance calculate kiya
        advances = db.query(func.sum(models.SalaryAdvance.amount)).filter(
            models.SalaryAdvance.employee_id == emp.id,
            extract('month', models.SalaryAdvance.date) == target_month,
            extract('year', models.SalaryAdvance.date) == target_year
        ).scalar() or 0.0
        
        # 3. Calculation: SIRF Base - Advance (Attendance ko hata diya yahan se)
        base = float(emp.base_salary or 0)
        net_payable = base - float(advances)
        
        # 4. Check for paid record
        paid_record = db.query(models.SalaryRecord).filter(
            models.SalaryRecord.employee_id == emp.id,
            models.SalaryRecord.month == month_str
        ).first()
        
        report.append({
            "id": emp.id,
            "name": emp.name,
            "base_salary": base,
            "present_days": present_count, # Ye frontend pe table mein dikhega
            "total_advance": float(advances),
            "net_payable": round(max(0, net_payable), 2), # Yahan sirf base - advance hua hai
            "status": "Paid" if paid_record else "Pending",
            "last_paid_to": paid_record.payment_date if paid_record else None
        })
        
    return report


@app.post("/salary/save-payment")
def save_salary_payment(client_id: int, data: dict = Body(...), db: Session = Depends(get_db)):
    new_record = models.SalaryRecord(
        employee_id=data['employee_id'],
        month=data['month'],
        paid_up_to=data['paid_up_to'],
        present_days=data['present_days'],
        base_salary=data['base_salary'],
        advance_taken=data['total_advance'],
        net_payable=data['net_payable'],
        status="Paid",
        payment_date=date.today().strftime("%Y-%m-%d"),
        client_id=client_id 
    )
    db.add(new_record)
    db.commit()
    return {"status": "success", "message": "Salary payment recorded successfully"}



