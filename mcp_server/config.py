import os
from dotenv import load_dotenv

# Load MCP environnement instead of .env no war
load_dotenv(".env.mcp")

FASTAPI_BASE_URL = os.getenv("MCP_FASTAPI_BASE_URL", "http://localhost:8000")


API_TOKEN = os.getenv("MCP_API_TOKEN", "")

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
