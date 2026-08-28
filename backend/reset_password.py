import sys

from auth import hash_password
from database import SessionLocal
from models import Employee, User, UserRole


def find_user(db, identifier: str) -> User | None:
    user = (
        db.query(User)
        .filter(User.role == UserRole.OWNER, User.email == identifier)
        .first()
    )
    if user is not None:
        return user

    employee = db.query(Employee).filter(Employee.employee_code == identifier).first()
    if employee is not None:
        return db.query(User).filter(User.employee_id == employee.id).first()

    return None


def reset_password(identifier: str, new_password: str) -> None:
    db = SessionLocal()
    try:
        user = find_user(db, identifier)
        if user is None:
            print(f"No user found for identifier '{identifier}'.")
            sys.exit(1)

        user.hashed_password = hash_password(new_password)
        db.commit()
        print(f"Password updated for '{identifier}' (username='{user.username}', role={user.role.value}).")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <identifier> <new_password>")
        print("  identifier: owner's email, or an employee's employee_code")
        sys.exit(1)

    reset_password(sys.argv[1], sys.argv[2])
