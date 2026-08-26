from datetime import date

from passlib.context import CryptContext

from database import Base, SessionLocal, engine
from models import Employee, Store, User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# NOTE: placeholder credentials only — change these before any real use.
PLACEHOLDER_PASSWORD = "changeme123"

STORES = [
    {"name": "Grocery", "type": "Daily Utilities / Grocery"},
    {"name": "Fashion", "type": "Clothes & Fashion"},
    {"name": "Electronics", "type": "Electronics"},
]


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
                hashed_password=pwd_context.hash(PLACEHOLDER_PASSWORD),
                role=UserRole.OWNER,
                store_id=None,
            )
            db.add(owner)
            created.append("Owner user: username='owner'")

        for store_name, store in stores_by_name.items():
            employee_name = f"{store_name} Test Employee"
            username = f"{store_name.lower()}_employee"

            employee = (
                db.query(Employee)
                .filter_by(store_id=store.id, name=employee_name)
                .first()
            )
            if employee is None:
                employee = Employee(
                    store_id=store.id,
                    name=employee_name,
                    role_title="Cashier",
                    hire_date=date.today(),
                )
                db.add(employee)
                db.flush()
                created.append(f"Employee: {employee_name} (store='{store_name}')")

            user = db.query(User).filter_by(username=username).first()
            if user is None:
                user = User(
                    username=username,
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
