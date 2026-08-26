from models import Employee

STORE_PREFIXES = {
    "grocery": "GRO",
    "fashion": "FAS",
    "electronics": "ELE",
}


def _prefix_for_store(store):
    key = store.name.strip().lower()
    if key in STORE_PREFIXES:
        return STORE_PREFIXES[key]
    return store.name.strip()[:3].upper()


def generate_employee_code(store, db_session):
    """Next sequential employee_code for a store, e.g. GRO-0001, GRO-0002."""
    prefix = _prefix_for_store(store)

    existing_codes = (
        db_session.query(Employee.employee_code)
        .filter(
            Employee.store_id == store.id,
            Employee.employee_code.like(f"{prefix}-%"),
        )
        .all()
    )

    max_seq = 0
    for (code,) in existing_codes:
        try:
            seq = int(code.split("-")[-1])
        except (ValueError, AttributeError):
            continue
        max_seq = max(max_seq, seq)

    return f"{prefix}-{max_seq + 1:04d}"
