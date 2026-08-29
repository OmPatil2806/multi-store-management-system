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
    # Content-Disposition isn't a CORS-safelisted response header by default,
    # so without this the frontend can download the file fine but can't read
    # the filename off the response — needed for the Excel export download.
    expose_headers=["Content-Disposition"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(employees.router)
app.include_router(sales.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok"}
