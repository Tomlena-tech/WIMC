from fastapi import FastAPI


app = FastAPI(
    title="W.I.M.C",
    description="Where Is My Child",
    version="0.0.1"

)


# starting point
@app.get("/")
def root():
    return {"message": "WIMC API is running now !!"}


# checking if API is ok or not
@app.get("/health")
def health_check():
    return {"status": "healthy"}
