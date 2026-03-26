from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.events import router as events_router
from routers.ingestion_router import router as ingestion_router
from routers.voice import router as voice_router
from utils.logger import logger
from config.misc import MiscConfig
from utils.health_checker import HealthChecker

load_dotenv(override=True)

app = FastAPI(title="PresAI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=MiscConfig.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(events_router, prefix="/api/v1", tags=["events"])
app.include_router(ingestion_router, prefix="/api/v1", tags=["ingestion"])
app.include_router(voice_router, prefix="/api/v1", tags=["voice"])

@app.get("/health")
async def health_check():
    """Basic health check - returns immediately"""
    return {"status": "ok", "message": "PresAI backend is running."}

@app.get("/health/detailed")
async def health_check_detailed():
    """Comprehensive health check - validates all service connections"""
    return await HealthChecker.run_all_checks()

if __name__ == "__main__":
    # This is now handled by startup.py
    # Run: python startup.py
    import uvicorn
    logger.warning("⚠️  Direct execution of main.py is deprecated.")
    logger.warning("👉 Use: python startup.py instead")
    logger.info("Starting server without health checks...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
