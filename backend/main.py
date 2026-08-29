from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, employees, products, reports, sales

app = FastAPI(title="Multi-Supermarket Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(employees.router)
app.include_router(sales.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok"}
