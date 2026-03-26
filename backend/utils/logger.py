import logging
import sys
import os

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Check environment variable to enable debug mode
        debug_mode = os.getenv("PRESAI_DEBUG", "false").lower() in ("true", "1", "yes")
        log_level = logging.DEBUG if debug_mode else logging.INFO
        
        logger.setLevel(log_level)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        formatter = logging.Formatter('%(asctime)s | %(levelname)-8s | %(name)s | %(message)s')
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        if debug_mode:
            logger.info("🔍 Debug mode enabled via PRESAI_DEBUG environment variable")
    return logger

logger = get_logger("presai")
