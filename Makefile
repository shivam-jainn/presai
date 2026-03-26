SHELL := /bin/bash

.PHONY: infra-up infra-down infra-logs backend-api worker frontend dev-all

infra-up:
	cd backend && docker compose up -d vectordb
	cd backend && docker compose up -d --force-recreate livekit

infra-down:
	cd backend && docker compose down

infra-logs:
	cd backend && docker compose logs -f livekit vectordb

backend-api:
	cd backend && source .venv/bin/activate && python startup.py

worker:
	cd backend && source .venv/bin/activate && python -m agents.slide_voice_worker dev

frontend:
	cd frontend && npm run dev

dev-all:
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000) & \
	(cd backend && source .venv/bin/activate && python -m agents.slide_voice_worker dev) & \
	(cd frontend && npm run dev) & \
	wait
