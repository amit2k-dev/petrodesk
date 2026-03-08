from sqlalchemy.orm import Session
import models, schemas

# --- SALE OPERATIONS ---
def create_sale(db: Session, client_id: int, sale: schemas.SaleCreate):
    diff = sale.closing - sale.opening
    actual = diff - sale.testing
    total = actual * float(sale.rate)

    db_sale = models.DailySale(
        **sale.model_dump(), # Pydantic v2 support
        client_id=client_id,
        difference=diff,
        actual_sale=actual,
        total_amount=total
    )
    db.add(db_sale)
    
    # Automatic stock deduction logic
    product_type = "Petrol" if "Petrol" in sale.nozzle else "Diesel"
    tank = db.query(models.Tank).filter(
        models.Tank.client_id == client_id,
        models.Tank.product_type.ilike(f"%{product_type}%")
    ).first()
    
    if tank:
        tank.current_stock -= actual
        
    db.commit()
    db.refresh(db_sale)
    return db_sale

# --- STAFF SHIFT OPERATIONS ---
def create_staff_shift(db: Session, client_id: int, shift: schemas.StaffShiftCreate):
    actual = (shift.closing_reading - shift.opening_reading)
    total_val = actual * shift.rate
    
    db_shift = models.StaffShift(
        **shift.model_dump(),
        client_id=client_id,
        actual_sale_ltr=actual,
        total_amount=total_val
    )
    db.add(db_shift)
    db.commit()
    return db_shift

# --- EMPLOYEE OPERATIONS ---
def get_employees_by_client(db: Session, client_id: int):
    return db.query(models.Employee).filter(models.Employee.client_id == client_id).all()

def create_employee(db: Session, client_id: int, emp: schemas.EmployeeCreate):
    db_emp = models.Employee(**emp.model_dump(), client_id=client_id, status="Active")
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

# --- ATTENDANCE ---
def mark_attendance(db: Session, client_id: int, att: schemas.AttendanceCreate):
    existing = db.query(models.Attendance).filter(
        models.Attendance.client_id == client_id,
        models.Attendance.employee_id == att.employee_id,
        models.Attendance.date == att.date
    ).first()
    
    if existing:
        existing.status = att.status
    else:
        db_att = models.Attendance(**att.model_dump(), client_id=client_id)
        db.add(db_att)
    
    db.commit()
    return {"status": "success"}