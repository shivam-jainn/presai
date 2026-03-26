from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse
from services.ingestion.pipeline import IngestionPipeline
from utils.logger import logger
from utils.storage import storage

router = APIRouter()

@router.post("/ingest")
async def ingest_ppt_route(request: Request, file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()

    if not filename:
        raise HTTPException(status_code=400, detail="Missing file name.")

    if extension not in {".ppt", ".pptx"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {filename}. Only PPT/PPTX files are allowed."
        )
    
    try:
        file.filename = filename
        logger.info(f"Incoming ingest request for file: {filename}")
        pipeline = IngestionPipeline()
        result = await pipeline.ingest(file)

        result["file_url"] = str(request.url_for("get_ppt_file", filename=result["filename"]))
        return result
    except Exception as e:
        logger.error(f"Ingestion route failed for {filename}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during PPT ingestion: {str(e)}"
        )

@router.get("/file/{filename}")
async def get_ppt_file(filename: str):
    """Serve the uploaded PPTX file for rendering in the frontend."""
    try:
        file_path = storage.get_file_path(filename)
        return FileResponse(
            path=file_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=filename
        )
    except FileNotFoundError as e:
        logger.error(f"File not found: {filename}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error serving file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))