import os
from dotenv import load_dotenv

load_dotenv()

class LLMConfig:
    PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
    MODEL = os.getenv("LLM_MODEL", "gpt-4")
    API_KEY = os.getenv("LLM_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    BASE_URL = os.getenv("LLM_BASE_URL", "")
    TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "1000"))
    
    # Provider-specific defaults
    @property
    def provider_config(self):
        if self.PROVIDER == "groq":
            return {
                "base_url": "https://api.groq.com/openai/v1",
                "default_model": "llama-3.1-70b-versatile"
            }
        elif self.PROVIDER in ["ollama", "lmstudio"]:
            return {
                "base_url": self.BASE_URL or "http://localhost:11434",
                "default_model": "llama2"
            }
        else:  # openai
            return {
                "base_url": None,
                "default_model": "gpt-4"
            }