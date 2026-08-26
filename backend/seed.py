from datetime import date

from passlib.context import CryptContext

from database import Base, SessionLocal, engine
from models import Employee, Store, User, UserRole
from utils import generate_employee_code

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# NOTE: placeholder credentials only — change these before any real use.
PLACEHOLDER_PASSWORD = "changeme123"

STORES = [
    {"name": "Grocery", "type": "Daily Utilities / Grocery"},
    {"name": "Fashion", "type": "Clothes & Fashion"},
    {"name": "Electronics", "type": "Electronics"},
]

# Placeholder personal details for the seeded test employee per store.
EMPLOYEE_DETAILS = {
    "Grocery": {"email": "grocery.employee@example.com", "dob": date(1990, 5, 14)},
    "Fashion": {"email": "fashion.employee@example.com", "dob": date(1992, 8, 23)},
    "Electronics": {"email": "electronics.employee@example.com", "dob": date(1988, 11, 2)},
}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    created = []

    try:
        stores_by_name = {}
        for store_data in STORES:
            store = db.query(Store).filter_by(name=store_data["name"]).first()
            if store is None:
                store = Store(name=store_data["name"], type=store_data["type"])
                db.add(store)
                db.flush()
                created.append(f"Store: {store.name}")
            stores_by_name[store.name] = store

        owner = db.query(User).filter_by(username="owner").first()
        if owner is None:
            owner = User(
                username="owner",
                email="owner@example.com",
                hashed_password=pwd_context.hash(PLACEHOLDER_PASSWORD),
                role=UserRole.OWNER,
                store_id=None,
            )
            db.add(owner)
            created.append("Owner user: username='owner'")

        for store_name, store in stores_by_name.items():
            employee_name = f"{store_name} Test Employee"
            username = f"{store_name.lower()}_employee"
            details = EMPLOYEE_DETAILS[store_name]

            employee = (
                db.query(Employee)
                .filter_by(store_id=store.id, name=employee_name)
                .first()
            )
            if employee is None:
                employee_code = generate_employee_code(store, db)
                employee = Employee(
                    store_id=store.id,
                    name=employee_name,
                    role_title="Cashier",
                    hire_date=date.today(),
                    email=details["email"],
                    date_of_birth=details["dob"],
                    employee_code=employee_code,
                )
                db.add(employee)
                db.flush()
                created.append(
                    f"Employee: {employee_name} (store='{store_name}', code='{employee_code}')"
                )

            user = db.query(User).filter_by(username=username).first()
            if user is None:
                user = User(
                    username=username,
                    # Employee accounts don't log in via email (Phase 2 uses
                    # employee_code via the linked Employee record), but the
                    # column is NOT NULL/unique at the User level, so reuse
                    # the employee's contact email here.
                    email=employee.email,
                    hashed_password=pwd_context.hash(PLACEHOLDER_PASSWORD),
                    role=UserRole.EMPLOYEE,
                    store_id=store.id,
                    employee_id=employee.id,
                )
                db.add(user)
                created.append(f"Employee user: username='{username}' (store='{store_name}')")

        db.commit()

        print("=== Seed summary ===")
        print("Stores in DB:", ", ".join(stores_by_name.keys()))
        if created:
            print("Newly created rows:")
            for line in created:
                print(f"  - {line}")
        else:
            print("No new rows created - all seed data already existed.")
        print(f"\nPlaceholder password for all seeded users: '{PLACEHOLDER_PASSWORD}' (CHANGE THIS before real use)")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
