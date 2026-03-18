import os
from fastmcp import FastMCP
from .tools import WIMCTools

# Créer le serveur MCP
mcp = FastMCP("WIMC")

# Initialiser les outils
tools = WIMCTools()

# Auto-login au démarrage si les credentials sont dans l'env
EMAIL = os.getenv("WIMC_EMAIL")
PASSWORD = os.getenv("WIMC_PASSWORD")

if EMAIL and PASSWORD:
    tools.login(EMAIL, PASSWORD)

@mcp.tool()
def login(email: str, password: str) -> dict:
    """Se connecter à WIMC pour obtenir un token JWT"""
    return tools.login(email, password)

@mcp.tool()
def get_children() -> dict:
    """Récupérer tous les enfants du parent connecté
    (authentification requise)"""
    return tools.get_children()


@mcp.tool()
def get_child(child_id: int) -> dict:
    """Récupérer un enfant spécifique par son ID"""
    return tools.get_child(child_id)


@mcp.tool()
def get_places() -> dict:
    """Récupérer toutes les locations de tous les enfants
    (authentification requise)"""
    return tools.get_places()


@mcp.tool()
def get_place(location_id: int) -> dict:
    """Récupérer une location spécifique par son ID"""
    return tools.get_place(location_id)


@mcp.tool()
def get_last_position(child_id: int) -> dict:
    """Récupérer la dernière position GPS d'un enfant"""
    return tools.get_last_position(child_id)


if __name__ == "__main__":
    print("🚀 Démarrage serveur MCP WIMC...")
    mcp.run()
