from fastmcp import FastMCP
from .tools import WIMCTools

# Créer le serveur MCP
mcp = FastMCP("WIMC")

# Initialiser les outils
tools = WIMCTools()


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


if __name__ == "__main__":
    print("🚀 Démarrage serveur MCP WIMC...")
    mcp.run()
