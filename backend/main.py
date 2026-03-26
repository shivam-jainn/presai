from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.ingestion import router as ingestion_router
from utils.logger import logger
from config.misc import MiscConfig

app = FastAPI(title="PresAI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=MiscConfig.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routers
app.include_router(ingestion_router, prefix="/api/v1", tags=["ingestion"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "PresAI backend is running."}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting PresAI backend...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
