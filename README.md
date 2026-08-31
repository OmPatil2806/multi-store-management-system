# Multi Store  Organization

I own three stores — a grocery, a clothing shop, and an electronics store — and for a while I was running all three off separate notebooks and whatever the till happened to remember. Opex Organization is the system I built to fix that: one login for me as the owner with visibility across all three stores, separate logins for each store's staff that only see their own store's data, and a proper record of stock, sales, and payroll instead of scattered paper.

It's a local-first web app. No cloud hosting, no monthly bill — it runs on a machine on my own network and everyone (me, cashiers, whoever's on shift) reaches it from their phone or the store's PC over WiFi.

## Features

**Product & stock**
Add, edit, and restock products per store. Prices and cost prices are owner-only to change; employees can still add new stock and register new products at the register, they just can't alter what something costs after the fact. Low-stock items are flagged automatically once quantity drops at or below a per-product threshold.

**Employees**
The owner creates employee accounts, each with an auto-generated employee code (e.g. `GRO-0004`) used for login instead of an email. Salaries are visible to the owner only — not just hidden in the UI, the field is stripped out of the API response before it ever reaches an employee's browser. Deactivating an employee cuts off their login immediately (even a token they already had open stops working on the next request) without deleting their record, so old sales still show who processed them.

**Checkout & sales**
A cart-based checkout screen for ringing up a sale: pick products, adjust quantities against live stock, choose a payment method (cash, card, UPI, other), and complete the sale. Stock is decremented atomically — if any item in the cart doesn't have enough stock, nothing in that sale goes through, not even the items that were fine. Every completed sale is kept in a full history, itemized, filterable by store and date.

**Analytics dashboard**
Revenue over time, top-selling products, stock value, low-stock counts, and a payment-method breakdown, all built with Recharts. As the owner you can look at one store or all three combined (with a per-store split), or switch to an "All Stores" view that lines up all three on the same revenue chart. Employees see the same kind of dashboard scoped to just their store.

**Excel export**
A one-click download of the current product/stock list as a formatted `.xlsx` — bold headers, sensible column widths, low-stock rows highlighted. The owner can export a single store or all three as separate sheets in one workbook; employees can only ever export their own store, and that's enforced on the backend, not just by what buttons the UI shows them.

**Security & access control** — see below, it's worth its own section.

## Why local-first

This isn't hosted anywhere. It's a FastAPI backend and a React frontend running on one PC, talking to a single SQLite file. For three physical stores on one WiFi network, that was a deliberate call rather than a limitation I'm working around: there's no hosting bill, no third party has a copy of my sales or payroll data, and a backup is just copying `supermarket.db` somewhere safe. If this ever needs to run across multiple physical locations that aren't on the same network, that's a real architecture change — not something this setup is trying to pretend to solve.

## Tech stack

**Backend:** Python, FastAPI, SQLAlchemy, SQLite, JWT auth (python-jose), password hashing (passlib/bcrypt), pandas + openpyxl for the Excel export.

**Frontend:** React (Vite), Tailwind CSS v4, shadcn/ui, Recharts for the dashboard charts, React Router, Axios.

## Project structure

```
multi-market-mang/
├── ARCHITECTURE.md
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── models.py                # SQLAlchemy models (Store, User, Employee, Product, Sale, SaleItem)
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── database.py               # engine/session setup
│   ├── auth.py, dependencies.py  # JWT issuing/validation, role & store-scope guards
│   ├── reports.py                # Excel report generation
│   ├── seed.py                    # seeds the 3 stores + owner + test employees
│   ├── reset_password.py          # CLI to set a real password for any account
│   └── routers/                   # auth, products, employees, sales, reports
│
└── frontend/
    └── src/
        ├── api/          # axios client with JWT attach + 401 handling
        ├── auth/          # AuthContext, ProtectedRoute
        ├── components/    # DataTable, form dialogs, charts/
        ├── pages/          # Login, Dashboard, Products, Employees, Checkout, Sales, Reports, MyProfile
        └── lib/
```

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in `JWT_SECRET_KEY` — generate one with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then seed the database and start the server:

```bash
python seed.py
uvicorn main:app --reload
```

`seed.py` creates the 3 stores, an owner account, and one test employee per store, all with the placeholder password `changeme123`. Use `python reset_password.py <email-or-employee_code> <new-password>` to set real passwords before actually relying on this.

### Frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` (defaults to `VITE_API_BASE_URL=http://localhost:8000`, which is fine for local use), then:

```bash
npm run dev
```

Visit `http://localhost:5173`. Log in as the owner with the email from `seed.py`, or as an employee with their employee code.

## Security & access control

There are exactly two roles — owner and employee — and the split isn't a UI-level toggle, it's enforced on every single request. The backend reads the caller's identity and store from their JWT and never trusts anything the client sends alongside it: if an employee's request includes a `store_id` for a different store (I tested this directly with curl, going around the UI entirely), it's simply ignored and their own store is used instead. The owner logs in with an email and password; employees log in with their employee code and password, and that's the only identifier that works for them — there's no way for an employee account to authenticate as if it were the owner's.

A few of the more deliberate decisions: price and cost-price edits are owner-only, even though employees can still add new stock and register brand-new products. Salary data is excluded from the response schema itself before it's serialized, not just hidden with CSS, so there's no way to see it by opening dev tools. And deactivating an employee doesn't delete their record — it flips an `is_active` flag that both blocks new logins and immediately invalidates any session token they already had, so their name still shows up correctly on historical sales without giving them continued access.

---

Built by [OmPatil2806](https://github.com/OmPatil2806).
