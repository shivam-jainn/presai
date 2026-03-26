#!/usr/bin/env python3
"""
PresAI Backend Startup Script
Runs health checks before starting the server
"""
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).parent
sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv
from utils.logger import logger
from utils.health_checker import HealthChecker


def print_banner():
    """Print startup banner"""
    print("\n" + "=" * 60)
    print("   🎤 PresAI - Voice-Controlled Presentation Assistant")
    print("=" * 60 + "\n")


async def run_startup_checks():
    """Run comprehensive health checks before startup"""
    print_banner()
    logger.info("🔍 Running startup health checks...")
    
    try:
        # Load environment
        load_dotenv(override=True)
        logger.info("✅ Environment loaded")
        
        # Run health checks
        health_report = await HealthChecker.run_all_checks()
        
        # Print summary
        print("\n" + "-" * 60)
        print("HEALTH CHECK SUMMARY")
        print("-" * 60)
        
        status = health_report["status"]
        summary = health_report["summary"]
        
        if status == "error":
            print(f"\n❌ STATUS: FAILED ({summary['errors']} errors)\n")
        elif status == "warning":
            print(f"\n⚠️  STATUS: WARNINGS ({summary['warnings']} warnings)\n")
        else:
            print(f"\n✅ STATUS: ALL CHECKS PASSED\n")
        
        # Print detailed results
        for check in health_report["checks"]:
            icon = "✅" if check["status"] == "ok" else ("⚠️" if check["status"] == "warning" else "❌")
            print(f"{icon} {check['name']}: {check['message']}")
        
        print("-" * 60 + "\n")
        
        # Return status code
        if status == "error":
            logger.error("⚠️  Critical health checks failed! Server may not function properly.")
            logger.error("👉 Check your .env configuration and restart services.")
            return False
        elif status == "warning":
            logger.warning("⚡ Some non-critical checks failed. Server will start with limited functionality.")
            return True
        else:
            logger.info("✨ All systems ready! Starting server...")
            return True
            
    except Exception as e:
        logger.error(f"❌ Health check failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def start_server():
    """Start the FastAPI server after health checks pass"""
    import uvicorn
    from main import app
    
    # Run health checks first
    checks_passed = await run_startup_checks()
    
    if not checks_passed:
        print("\n" + "=" * 60)
        print("⚠️  SERVER STARTUP ABORTED DUE TO HEALTH CHECK FAILURES")
        print("=" * 60)
        print("\n💡 To start anyway (not recommended), use:")
        print("   uv run uvicorn main:app --host 0.0.0.0 --port 8000")
        print("\nOr fix the issues and try again.\n")
        sys.exit(1)
    
    # Start server - uvicorn will handle the event loop
    logger.info("🚀 Starting PresAI backend server on http://0.0.0.0:8000")
    logger.info("📖 API docs available at http://localhost:8000/docs")
    logger.info("💚 Health check: http://localhost:8000/health/detailed\n")
    
    # Use uvicorn.run which manages its own event loop
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    try:
        # Run health checks in the existing event loop
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        checks_passed = loop.run_until_complete(run_startup_checks())
        
        if not checks_passed:
            print("\n" + "=" * 60)
            print("⚠️  SERVER STARTUP ABORTED DUE TO HEALTH CHECK FAILURES")
            print("=" * 60)
            print("\n💡 To start anyway (not recommended), use:")
            print("   uv run uvicorn main:app --host 0.0.0.0 --port 8000")
            print("\nOr fix the issues and try again.\n")
            sys.exit(1)
        
        # Close the loop before starting uvicorn
        loop.close()
        
        # Now start uvicorn which will create its own loop
        import uvicorn
        from main import app
        
        print("🚀 Starting PresAI backend server on http://0.0.0.0:8000")
        print("📖 API docs available at http://localhost:8000/docs")
        print("💚 Health check: http://localhost:8000/health/detailed\n")
        
        uvicorn.run(app, host="0.0.0.0", port=8000)
        
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
