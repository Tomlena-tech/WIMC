from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routes.auth import router as auth_router


app = FastAPI(
    title="W.I.M.C",
    description="Where Is My Child",
    version="0.0.1"

)
app.include_router(auth_router)


@app.get("/ping")
def ping():
    return {"ping": "ok"}


# starting point
@app.get("/")
def root():
    return {"message": "WIMC API is running now !!"}


# checking if API is ok or not
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# next test "smoke test"
@app.get("/users/count")
def count_users(db: Session = Depends(get_db)):
    from app.models.user import User
    count = db.query(User).count()
    return {"users_count": 0}
