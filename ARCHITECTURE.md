# Multi-Supermarket Management System — Project Architecture

**Owner:** You
**Team:** You (Product Owner / Decision Maker) + Claude Code (Engineering Partner in VS Code)
**Deployment Mode:** Local-only (LAN-based, no cloud hosting)
**Author of this document:** Senior Business Developer / System Architect (Claude)

---

## 1. Problem Statement

You own **3 independent supermarkets**, each operating in a different retail category:

1. **Store 1 — Daily Utilities / Grocery**
2. **Store 2 — Clothes & Fashion**
3. **Store 3 — Electronics**

Today, there is no unified system to manage them. Challenges:

- No single place to track **products, stock levels, and prices** across all 3 stores
- No centralized way to manage **employees** per store
- No **sales/checkout** record-keeping — hard to know what sold, when, and by whom
- No **reporting** — you can't see daily performance, low stock, or revenue without visiting each store
- No **data isolation** — a system without proper boundaries risks one store's data (or one employee's data) being exposed to people who shouldn't see it
- No infrastructure budget — you don't want to pay for hosting/cloud servers; everything must run **locally**, from your own PC, on your own network

**Core problem:** You need one platform to manage 3 operationally-different businesses, with strict data boundaries, role-based access, real product/stock/price control, and daily reporting — without any cloud dependency.

---

## 2. Solution Overview

A **local-first, multi-tenant web application** where:

- **"Tenant" = Store.** Each of the 3 stores is an isolated tenant inside one shared system.
- **You (Owner)** have full visibility and control across all 3 stores from a single dashboard.
- **Employees** log in and can only interact with their **own store**, and only with **their own personal data** — never another employee's data, and never another store's data.
- All data (products, stock, prices, employees, sales) is stored in a **local SQLite database file** on your PC — no cloud, no third-party server, no ongoing cost.
- The app runs via two local commands (`uvicorn` for backend, `npm run dev` for frontend) and is accessible to any device on the **same WiFi network** — so employees can use it from their own phone/tablet/PC without you deploying anything online.
- Employees can **download an Excel (.xlsx) report** of their store's daily product/stock data directly from the app.

---

## 3. Final Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | **React (Vite) + Tailwind CSS + shadcn/ui** | Modern, interactive, professional "SaaS dashboard" look. Fast dev server. |
| Charts/Visualization | **Recharts** | Clean, React-native charting for stock/revenue/dashboards |
| Backend | **Python + FastAPI** | Fast, modern, auto-generated API docs, great for structured business logic |
| ORM | **SQLAlchemy** | Maps Python objects to database tables cleanly |
| Database | **SQLite** (`supermarket.db`) | Zero-setup, single-file, perfect for local-only single-machine deployment |
| Auth | **JWT (JSON Web Tokens)** via FastAPI + `passlib` (password hashing) | Secure login for Owner and Employees, role & store embedded in token |
| Excel Reports | **pandas + openpyxl** | Generate `.xlsx` downloads on demand |
| Local Network Access | **Uvicorn `--host 0.0.0.0`**, Vite `--host` flag | Makes the app reachable by other devices on the same WiFi |
| Dev Environment | **VS Code + Claude Code** | Primary coding workflow |

**No deployment tools (Docker/cloud/CI-CD) are used** — intentionally, per your requirement of local-only execution.

---

## 4. High-Level Architecture

```
                     ┌─────────────────────────────┐
                     │   Your PC (the "server")    │
                     │                              │
                     │  ┌────────────────────────┐  │
                     │  │  FastAPI Backend        │  │
                     │  │  (port 8000)            │  │
                     │  │  - Auth (JWT)           │  │
                     │  │  - Products API         │  │
                     │  │  - Employees API        │  │
                     │  │  - Sales/Checkout API   │  │
                     │  │  - Reports/Excel API    │  │
                     │  └───────────┬────────────┘  │
                     │              │                │
                     │  ┌───────────▼────────────┐  │
                     │  │  SQLite DB              │  │
                     │  │  supermarket.db         │  │
                     │  │  (stores/products/      │  │
                     │  │   employees/sales)      │  │
                     │  └────────────────────────┘  │
                     │                              │
                     │  ┌────────────────────────┐  │
                     │  │  React Frontend         │  │
                     │  │  (port 5173)            │  │
                     │  └────────────────────────┘  │
                     └──────────────┬───────────────┘
                                    │
                          Same WiFi / LAN
                                    │
          ┌─────────────┬──────────┴─────────┬─────────────┐
          │              │                     │             │
    Owner's device   Employee (Store 1)   Employee (Store 2)  Employee (Store 3)
    (full access)    (scoped access)      (scoped access)     (scoped access)
```

Every request from any device passes through the **same backend**, which enforces store-level and user-level isolation on every single query — isolation is never left to the frontend.

---

## 5. Data Model (ERD Summary)

```
Store
 ├─ id (PK)
 ├─ name                 e.g. "Grocery", "Fashion", "Electronics"
 └─ type

User (login account — owner or employee)
 ├─ id (PK)
 ├─ username
 ├─ hashed_password
 ├─ role                 "owner" | "employee"
 ├─ store_id (FK, null for owner)
 └─ employee_id (FK, nullable)

Employee
 ├─ id (PK)
 ├─ store_id (FK)
 ├─ name
 ├─ role_title            e.g. "Cashier", "Stock Manager"
 ├─ phone
 ├─ salary                 (owner-only visibility)
 └─ hire_date

Product
 ├─ id (PK)
 ├─ store_id (FK)
 ├─ name
 ├─ category
 ├─ sku
 ├─ price
 ├─ cost_price
 ├─ quantity
 ├─ low_stock_threshold
 ├─ created_by (employee/owner id)
 └─ updated_at

Sale (checkout record)
 ├─ id (PK)
 ├─ store_id (FK)
 ├─ employee_id (FK)
 ├─ date
 └─ total_amount

SaleItem
 ├─ id (PK)
 ├─ sale_id (FK)
 ├─ product_id (FK)
 ├─ quantity
 └─ price_at_sale
```

**Isolation rule (enforced server-side, always):**
`store_id` and `user identity` are read from the **JWT token**, never from frontend request parameters. No endpoint trusts a client-supplied store ID or user ID for authorization decisions.

---

## 6. Roles & Permissions Matrix

| Action | Owner | Employee |
|---|---|---|
| View all 3 stores | ✅ | ❌ (own store only) |
| Add / restock products | ✅ | ✅ (their store only) |
| Edit product price | ✅ | ❌ |
| Delete product | ✅ | ❌ |
| View stock levels | ✅ | ✅ (own store only) |
| Process a sale (checkout) | ✅ | ✅ (own store only) |
| Add/remove employees | ✅ | ❌ |
| View employee salary/personal data | ✅ | ❌ (not even their own record's salary field, unless you decide otherwise) |
| View another employee's data | ✅ | ❌ never |
| Download Excel report | ✅ (any/all stores) | ✅ (own store only) |
| View dashboard/analytics | ✅ (cross-store) | ✅ (own store only, limited) |

---

## 7. The Team

### You — Product Owner
- Define business rules, priorities, and approve each phase
- Test each phase locally before moving to the next
- Make final calls on role permissions (e.g. Option A vs B decisions)

### Claude Code — Engineering Partner (VS Code)
Acting as a senior full-stack engineer responsible for implementation. Assigned "skills" for this project:

| Skill Area | Responsibility |
|---|---|
| **Backend Engineering** | FastAPI app structure, SQLAlchemy models, Pydantic schemas, JWT auth, permission enforcement |
| **Database Design** | SQLite schema, relationships, migrations (using Alembic once schema stabilizes) |
| **Frontend Engineering** | React component architecture, Tailwind/shadcn UI, routing, state management |
| **Data Visualization** | Recharts dashboards, live-updating charts tied to API data |
| **Security Engineering** | Password hashing, JWT handling, role-based access control (RBAC), server-side authorization checks on every endpoint |
| **Reporting** | pandas/openpyxl Excel generation, scoped by store/role |
| **Local Networking** | Correct host/port binding so the app is LAN-accessible, `.env` config for API base URLs |

### Rules for Claude Code (project constraints)

1. **Never trust the frontend for authorization.** Every store-scoped or user-scoped query must filter using the identity extracted from the verified JWT token — never from a URL param or request body the client controls.
2. **No cloud/deployment tooling.** No Docker, no cloud SDKs, no CI/CD pipelines. Everything must run via local commands only (`uvicorn`, `npm run dev`).
3. **SQLite only**, single file (`supermarket.db`), no external DB server.
4. **Every sensitive field (salary, password hash) must be excluded from API responses** unless the requester's role explicitly permits it — filtering happens in the Pydantic response schema, not just hidden in the UI.
5. **One store's data must never appear in a query result for another store**, even in cross-store owner reports — cross-store views must explicitly aggregate per store, not merge indiscriminately.
6. **Build in phases** (see Section 8) — do not jump ahead to later phases before the current phase runs correctly and is confirmed working locally.
7. **Every new API endpoint needs a corresponding permission check** — no endpoint should be left open without an explicit role/store check, even during early development.
8. **Keep code modular** — routers, models, and schemas separated by domain (products, employees, sales, reports), matching the folder structure in Section 9.
9. **Write minimal but clear inline comments** explaining *why*, not just *what*, especially around auth/isolation logic — this is the most safety-critical part of the app.
10. **Use environment variables** (`.env`) for secrets (JWT secret key, etc.) — never hardcode credentials in source files.

---

## 8. Implementation Phases

Build and test **one phase at a time** in VS Code with Claude Code. Do not proceed to the next phase until the current one runs and is verified locally.

### Phase 0 — Project Scaffolding
- Create `backend/` and `frontend/` folder structure
- Initialize FastAPI app (`main.py`) with a health-check route
- Initialize React app via Vite, install Tailwind + shadcn/ui
- Confirm both servers run locally (`uvicorn`, `npm run dev`)

### Phase 1 — Database & Models
- Set up SQLAlchemy + SQLite connection
- Create models: `Store`, `User`, `Employee`, `Product`, `Sale`, `SaleItem`
- Seed the 3 stores (Grocery, Fashion, Electronics) via a seed script
- Verify `supermarket.db` is created and tables exist

### Phase 2 — Authentication & Roles
- Implement `/auth/login` with JWT issuing
- Implement password hashing (`passlib`)
- Implement `get_current_user` dependency (decodes JWT → role + store_id + user_id)
- Create the Owner account (seed script) and one test Employee account per store
- Verify login works and returns correct role/store in token

### Phase 3 — Product & Stock Management API
- CRUD endpoints for products, scoped by `store_id` from token
- Role rules: Owner → full CRUD; Employee → add/restock only, no price edit/delete (per Section 6)
- Low-stock threshold logic

### Phase 4 — Employee Management API (Owner-only)
- CRUD endpoints for employees, scoped by store
- Salary/sensitive fields excluded from any non-owner response

### Phase 5 — Frontend: Auth + Layout
- Login page
- Auth context (store JWT, decode role/store)
- Sidebar navigation, store switcher (owner only), protected routes by role

### Phase 6 — Frontend: Product & Employee Screens
- Data tables (search/filter/sort) for products and employees
- Add/edit forms (modals), respecting role permissions from Section 6

### Phase 7 — Sales / Checkout Flow
- Backend: `/sales` endpoint — select products + quantities → auto-decrement stock → create `Sale` + `SaleItem` records
- Frontend: Checkout screen (product picker, cart, total, confirm sale)

### Phase 8 — Dashboard & Visualization
- Backend: `/reports/dashboard` aggregated endpoint (per store + cross-store for owner)
- Frontend: Recharts — stock by category, revenue by store, low-stock alerts, sales trend

### Phase 9 — Excel Report Download
- Backend: `/reports/daily-excel` — generates `.xlsx` via pandas/openpyxl, scoped to requester's store (or all stores for owner)
- Frontend: "Download Report" button on dashboard

### Phase 10 — Local Network Access & Polish
- Configure `uvicorn --host 0.0.0.0` and Vite `--host`
- Document static local IP setup + firewall port allow (8000, 5173)
- Final UI polish, loading states, error handling, empty states

---

## 9. Final Folder Structure

```
supermarket-app/
├── ARCHITECTURE.md                 ← this file
├── backend/
│   ├── main.py                     # FastAPI entrypoint
│   ├── database.py                 # SQLite/SQLAlchemy connection
│   ├── models.py                   # SQLAlchemy models
│   ├── schemas.py                  # Pydantic request/response schemas
│   ├── auth.py                     # JWT creation/validation, password hashing
│   ├── dependencies.py             # get_current_user, role/store guards
│   ├── seed.py                     # Seeds 3 stores + owner + test employees
│   ├── .env                        # JWT secret, config (not committed)
│   ├── requirements.txt
│   ├── routers/
│   │   ├── auth.py
│   │   ├── stores.py
│   │   ├── products.py
│   │   ├── employees.py
│   │   ├── sales.py
│   │   └── reports.py
│   └── supermarket.db              # created automatically on first run
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env                        # VITE_API_BASE_URL
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   ├── client.js           # axios instance, attaches JWT
        │   ├── products.js
        │   ├── employees.js
        │   ├── sales.js
        │   └── reports.js
        ├── auth/
        │   ├── AuthContext.jsx
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Products.jsx
        │   ├── Employees.jsx
        │   ├── Checkout.jsx
        │   └── Reports.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── StoreSwitcher.jsx
        │   ├── DataTable.jsx
        │   ├── ProductFormModal.jsx
        │   ├── EmployeeFormModal.jsx
        │   └── charts/
        │       ├── RevenueChart.jsx
        │       ├── StockChart.jsx
        │       └── LowStockAlert.jsx
        └── styles/
            └── index.css
```

---

## 10. Running the App Locally

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev -- --host
```

Then:
- You (owner): open `http://localhost:5173`
- Employees (same WiFi): open `http://<your-pc-local-ip>:5173`

---

## 11. Next Step

Start with **Phase 0** in VS Code with Claude Code: scaffold the `backend/` and `frontend/` folders exactly as shown in Section 9, get both dev servers running, and confirm before moving to Phase 1.
