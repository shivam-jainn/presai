"""
Health Check System for PresAI Backend
Validates all service connections and configurations on startup
"""
import asyncio
from typing import Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from utils.logger import logger


class HealthStatus(str, Enum):
    OK = "ok"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class HealthCheckResult:
    name: str
    status: HealthStatus
    message: str
    details: Dict[str, Any] = None


class HealthChecker:
    """Centralized health check system for all services"""
    
    @staticmethod
    async def check_qdrant() -> HealthCheckResult:
        """Check Qdrant vector database connection"""
        from config import config
        
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{config.QDRANT_URL}")
                if response.status_code == 200:
                    return HealthCheckResult(
                        name="Qdrant Vector DB",
                        status=HealthStatus.OK,
                        message=f"Connected to {config.QDRANT_URL}",
                        details={"version": response.json().get("version", "unknown")}
                    )
                else:
                    return HealthCheckResult(
                        name="Qdrant Vector DB",
                        status=HealthStatus.ERROR,
                        message=f"Qdrant returned status {response.status_code}",
                        details={"url": config.QDRANT_URL}
                    )
        except Exception as e:
            return HealthCheckResult(
                name="Qdrant Vector DB",
                status=HealthStatus.ERROR,
                message=f"Cannot connect to Qdrant: {str(e)}",
                details={"url": config.QDRANT_URL}
            )
    
    @staticmethod
    async def check_ollama() -> HealthCheckResult:
        """Check Ollama connectivity (for LLM and/or embeddings)"""
        from config import config
        
        ollama_required = (
            config.EMBEDDINGS_PROVIDER == "local" or
            config.LLM_PROVIDER == "ollama" or
            config.LLM_PROVIDER == "lmstudio"
        )
        
        if not ollama_required:
            return HealthCheckResult(
                name="Ollama",
                status=HealthStatus.OK,
                message="Not configured (skipped)",
                details={"configured_for": "none"}
            )
        
        try:
            import httpx
            base_url = config.EMBEDDINGS_MODEL_URL if config.EMBEDDINGS_PROVIDER == "local" else config.LLM_MODEL_URL
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{base_url}/api/tags")
                if response.status_code == 200:
                    models_data = response.json()
                    models = models_data.get("models", [])
                    
                    # Check if required models are available
                    required_models = []
                    if config.LLM_PROVIDER == "ollama":
                        required_models.append(config.LLM_MODEL_NAME)
                    if config.EMBEDDINGS_PROVIDER == "local":
                        required_models.append(config.EMBEDDINGS_MODEL_NAME)
                    
                    available_models = [m["name"] for m in models]
                    missing_models = [m for m in required_models if m not in available_models]
                    
                    if missing_models:
                        return HealthCheckResult(
                            name="Ollama",
                            status=HealthStatus.WARNING,
                            message=f"Connected but missing models: {', '.join(missing_models)}",
                            details={
                                "url": base_url,
                                "available_models": available_models,
                                "required_models": required_models,
                                "pull_command": f"ollama pull {missing_models[0]}"
                            }
                        )
                    
                    return HealthCheckResult(
                        name="Ollama",
                        status=HealthStatus.OK,
                        message=f"Connected with {len(models)} model(s)",
                        details={
                            "url": base_url,
                            "models": available_models
                        }
                    )
                else:
                    return HealthCheckResult(
                        name="Ollama",
                        status=HealthStatus.ERROR,
                        message=f"Unexpected response: {response.status_code}",
                        details={"url": base_url}
                    )
        except ImportError:
            return HealthCheckResult(
                name="Ollama",
                status=HealthStatus.ERROR,
                message="httpx package not installed",
                details={"install": "pip install httpx"}
            )
        except Exception as e:
            return HealthCheckResult(
                name="Ollama",
                status=HealthStatus.ERROR,
                message=f"Cannot connect to Ollama: {str(e)}",
                details={"url": base_url if 'base_url' in locals() else config.EMBEDDINGS_MODEL_URL}
            )
    
    @staticmethod
    async def check_groq() -> HealthCheckResult:
        """Check Groq API connectivity (for LLM and/or STT)"""
        from config import config
        
        uses_groq = (
            config.LLM_PROVIDER == "groq" or
            config.STT_PROVIDER == "groq"
        )
        
        if not uses_groq:
            return HealthCheckResult(
                name="Groq API",
                status=HealthStatus.OK,
                message="Not configured (skipped)",
                details={"configured_for": "none"}
            )
        
        if not config.LLM_API_KEY:
            return HealthCheckResult(
                name="Groq API",
                status=HealthStatus.ERROR,
                message="API key not configured",
                details={"configured_for": f"LLM={config.LLM_PROVIDER=='groq'}, STT={config.STT_PROVIDER=='groq'}"}
            )
        
        try:
            from groq import Groq
            client = Groq(api_key=config.LLM_API_KEY)
            
            # Test LLM if configured
            llm_tested = False
            if config.LLM_PROVIDER == "groq":
                try:
                    client.chat.completions.create(
                        model=config.LLM_MODEL_NAME,
                        messages=[{"role": "user", "content": "Health check"}],
                        max_tokens=10,
                        timeout=5
                    )
                    llm_tested = True
                except Exception as e:
                    return HealthCheckResult(
                        name="Groq API",
                        status=HealthStatus.ERROR,
                        message=f"LLM test failed: {str(e)}",
                        details={"model": config.LLM_MODEL_NAME}
                    )
            
            # Test STT if configured (just validate API access)
            stt_tested = False
            if config.STT_PROVIDER == "groq":
                try:
                    client.models.list()
                    stt_tested = True
                except Exception as e:
                    return HealthCheckResult(
                        name="Groq API",
                        status=HealthStatus.ERROR,
                        message=f"STT API test failed: {str(e)}",
                        details={"model": config.STT_MODEL_NAME}
                    )
            
            return HealthCheckResult(
                name="Groq API",
                status=HealthStatus.OK,
                message="API key valid" + (" (LLM tested)" if llm_tested else "") + (" (STT tested)" if stt_tested else ""),
                details={
                    "configured_for": f"LLM={config.LLM_PROVIDER=='groq'}, STT={config.STT_PROVIDER=='groq'}",
                    "llm_model": config.LLM_MODEL_NAME if config.LLM_PROVIDER == "groq" else None,
                    "stt_model": config.STT_MODEL_NAME if config.STT_PROVIDER == "groq" else None
                }
            )
        except ImportError:
            return HealthCheckResult(
                name="Groq API",
                status=HealthStatus.ERROR,
                message="Groq package not installed",
                details={"install": "pip install groq"}
            )
        except Exception as e:
            return HealthCheckResult(
                name="Groq API",
                status=HealthStatus.ERROR,
                message=f"Cannot connect to Groq: {str(e)}",
                details={"api_key_valid": bool(config.LLM_API_KEY)}
            )
    
    @staticmethod
    async def check_deepgram() -> HealthCheckResult:
        """Check Deepgram API connectivity (for STT and/or TTS)"""
        from config import config
        
        uses_deepgram = (
            config.STT_PROVIDER == "deepgram" or
            config.TTS_PROVIDER == "deepgram"
        )
        
        if not uses_deepgram:
            return HealthCheckResult(
                name="Deepgram API",
                status=HealthStatus.OK,
                message="Not configured (skipped)",
                details={"configured_for": "none"}
            )
        
        if not config.TTS_API_KEY:
            return HealthCheckResult(
                name="Deepgram API",
                status=HealthStatus.ERROR,
                message="API key not configured",
                details={"configured_for": f"STT={config.STT_PROVIDER=='deepgram'}, TTS={config.TTS_PROVIDER=='deepgram'}"}
            )
        
        try:
            import httpx
            # Test by making a simple API call to projects endpoint
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    "https://api.deepgram.com/v1/projects",
                    headers={"Authorization": f"Token {config.TTS_API_KEY}"}
                )
                
                if response.status_code == 200:
                    return HealthCheckResult(
                        name="Deepgram API",
                        status=HealthStatus.OK,
                        message="API key valid" + (" (STT+TTS)" if config.STT_PROVIDER == "deepgram" and config.TTS_PROVIDER == "deepgram" else ""),
                        details={
                            "configured_for": f"STT={config.STT_PROVIDER=='deepgram'}, TTS={config.TTS_PROVIDER=='deepgram'}",
                            "stt_model": config.STT_MODEL_NAME if config.STT_PROVIDER == "deepgram" else None,
                            "tts_model": config.TTS_MODEL_NAME if config.TTS_PROVIDER == "deepgram" else None,
                            "tts_voice": config.TTS_VOICE if config.TTS_PROVIDER == "deepgram" else None
                        }
                    )
                elif response.status_code == 401:
                    return HealthCheckResult(
                        name="Deepgram API",
                        status=HealthStatus.ERROR,
                        message="Invalid API key",
                        details={"error": "401 Unauthorized"}
                    )
                else:
                    return HealthCheckResult(
                        name="Deepgram API",
                        status=HealthStatus.WARNING,
                        message=f"API returned status {response.status_code}",
                        details={"status": response.status_code}
                    )
        except Exception as e:
            return HealthCheckResult(
                name="Deepgram API",
                status=HealthStatus.ERROR,
                message=f"Cannot verify Deepgram API: {str(e)}",
                details={"error": str(e)}
            )
    
    @staticmethod
    async def check_livekit() -> HealthCheckResult:
        """Check LiveKit server connectivity"""
        from config import config
        
        try:
            import httpx
            # LiveKit doesn't have a simple health endpoint, but we can check WebSocket
            ws_url = config.LIVEKIT_URL.replace("ws://", "http://").replace("wss://", "https://")
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{ws_url}/")
                # Even if it returns 404, the connection succeeded
                if response.status_code < 500:
                    return HealthCheckResult(
                        name="LiveKit Server",
                        status=HealthStatus.OK,
                        message=f"Connected to {config.LIVEKIT_URL}",
                        details={
                            "url": config.LIVEKIT_URL,
                            "mode": config.VOICE_MODE
                        }
                    )
                else:
                    return HealthCheckResult(
                        name="LiveKit Server",
                        status=HealthStatus.ERROR,
                        message=f"LiveKit returned status {response.status_code}",
                        details={"url": config.LIVEKIT_URL}
                    )
        except Exception as e:
            return HealthCheckResult(
                name="LiveKit Server",
                status=HealthStatus.ERROR,
                message=f"Cannot connect to LiveKit: {str(e)}",
                details={
                    "url": config.LIVEKIT_URL,
                    "mode": config.VOICE_MODE
                }
            )
    
    @staticmethod
    async def check_file_storage() -> HealthCheckResult:
        """Check file storage path is accessible"""
        from config import config
        from pathlib import Path
        
        try:
            storage_path = Path(config.FILE_STORAGE_PATH)
            
            # Try to create directory if it doesn't exist
            storage_path.mkdir(parents=True, exist_ok=True)
            
            # Check if writable
            test_file = storage_path / ".presai_health_check"
            test_file.write_text("test")
            test_file.unlink()
            
            return HealthCheckResult(
                name="File Storage",
                status=HealthStatus.OK,
                message=f"Storage path ready: {storage_path.absolute()}",
                details={
                    "path": str(storage_path.absolute()),
                    "writable": True
                }
            )
        except Exception as e:
            return HealthCheckResult(
                name="File Storage",
                status=HealthStatus.ERROR,
                message=f"Storage path issue: {str(e)}",
                details={"path": str(config.FILE_STORAGE_PATH)}
            )
    
    @staticmethod
    async def run_all_checks() -> Dict[str, Any]:
        """Run all health checks and return comprehensive report"""
        logger.info("Running comprehensive health checks...")
        
        checks: List[HealthCheckResult] = []
        
        # Run all checks concurrently
        results = await asyncio.gather(
            HealthChecker.check_qdrant(),
            HealthChecker.check_ollama(),
            HealthChecker.check_groq(),
            HealthChecker.check_deepgram(),
            HealthChecker.check_livekit(),
            HealthChecker.check_file_storage(),
            return_exceptions=True
        )
        
        # Process results
        for result in results:
            if isinstance(result, Exception):
                checks.append(HealthCheckResult(
                    name="Unknown",
                    status=HealthStatus.ERROR,
                    message=f"Check failed: {str(result)}",
                    details={"exception": str(result)}
                ))
            else:
                checks.append(result)
        
        # Determine overall status
        error_count = sum(1 for c in checks if c.status == HealthStatus.ERROR)
        warning_count = sum(1 for c in checks if c.status == HealthStatus.WARNING)
        
        overall_status = HealthStatus.OK
        if error_count > 0:
            overall_status = HealthStatus.ERROR
        elif warning_count > 0:
            overall_status = HealthStatus.WARNING
        
        # Build response
        response = {
            "status": overall_status.value,
            "timestamp": asyncio.get_event_loop().time(),
            "summary": {
                "total_checks": len(checks),
                "passed": sum(1 for c in checks if c.status == HealthStatus.OK),
                "warnings": warning_count,
                "errors": error_count
            },
            "checks": [
                {
                    "name": c.name,
                    "status": c.status.value,
                    "message": c.message,
                    "details": c.details or {}
                }
                for c in checks
            ]
        }
        
        # Log summary
        logger.info(f"Health check complete: {response['summary']['passed']}/{response['summary']['total_checks']} passed")
        if error_count > 0:
            logger.error(f"⚠️  {error_count} health check(s) failed!")
        elif warning_count > 0:
            logger.warning(f"⚡ {warning_count} warning(s) found")
        else:
            logger.info("✅ All health checks passed!")
        
        return response
