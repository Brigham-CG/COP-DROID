from fastapi import FastAPI

app = FastAPI(title="COP-DROID", version="0.1.0")


@app.get("/")
async def root():
    return {"message": "COP-DROID"}


@app.get("/health")
async def health():
    return {"status": "ok"}
