"""
Voice Worker Monitor
Tracks worker heartbeats and provides health status
"""
import time
from typing import Optional
from utils.logger import logger


class VoiceWorkerMonitor:
    """Monitor voice worker health via heartbeats"""
    
    _last_heartbeat: Optional[float] = None
    _heartbeat_threshold = 120  # seconds - consider dead if no heartbeat for 2 minutes
    
    @classmethod
    def record_heartbeat(cls) -> None:
        """Record a heartbeat from the worker"""
        cls._last_heartbeat = time.time()
        logger.debug(f"Worker heartbeat recorded at {cls._last_heartbeat}")
    
    @classmethod
    def is_alive(cls) -> bool:
        """Check if worker is considered alive based on last heartbeat"""
        if cls._last_heartbeat is None:
            return False
        
        time_since_heartbeat = time.time() - cls._last_heartbeat
        is_alive = time_since_heartbeat < cls._heartbeat_threshold
        
        if not is_alive:
            logger.warning(
                f"Worker appears dead - no heartbeat for {time_since_heartbeat:.1f}s "
                f"(threshold: {cls._heartbeat_threshold}s)"
            )
        
        return is_alive
    
    @classmethod
    def get_status(cls) -> dict:
        """Get worker status information"""
        if cls._last_heartbeat is None:
            return {
                "status": "no_heartbeat",
                "message": "No heartbeat received yet",
                "last_heartbeat": None,
                "is_alive": False
            }
        
        time_since = time.time() - cls._last_heartbeat
        is_alive = time_since < cls._heartbeat_threshold
        
        return {
            "status": "alive" if is_alive else "dead",
            "message": f"Last heartbeat {time_since:.1f}s ago",
            "last_heartbeat": cls._last_heartbeat,
            "seconds_since_heartbeat": time_since,
            "is_alive": is_alive
        }
    
    @classmethod
    def reset(cls) -> None:
        """Reset monitor state (useful for testing or manual reset)"""
        cls._last_heartbeat = None
        logger.info("Worker monitor reset")
