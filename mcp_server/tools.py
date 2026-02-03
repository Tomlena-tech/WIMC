import requests
from typing import Dict, Any, Optional


class WIMCTools:
    """Outils pour interagir avec l'API WIMC"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token: Optional[str] = None
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authentification et récupération du token JWT"""
        try:
            url = f"{self.base_url}/auth/login?email={email}&password={password}"
            response = requests.post(url)

            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}

            data = response.json()
            self.token = data.get("access_token")
            return {"success": True, "token": self.token}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Impossible de se connecter au serveur WIMC"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_children(self) -> Dict[str, Any]:
        """Récupère tous les enfants du parent connecté"""
        if not self.token:
            return {"success": False, "error": "Non authentifié - utilise d'abord login()"}

        try:
            response = requests.get(
                f"{self.base_url}/children/",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 401:
                return {"success": False, "error": "Token expiré ou invalide"}
            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}

            return {"success": True, "data": response.json()}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Impossible de se connecter au serveur WIMC"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_child(self, child_id: int) -> Dict[str, Any]:
        """Récupère un enfant spécifique"""
        if not self.token:
            return {"success": False, "error": "Non authentifié - utilise d'abord login()"}

        try:
            response = requests.get(
                f"{self.base_url}/children/{child_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 401:
                return {"success": False, "error": "Token expiré ou invalide"}
            if response.status_code == 404:
                return {"success": False, "error": f"Enfant {child_id} non trouvé"}
            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}

            return {"success": True, "data": response.json()}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Impossible de se connecter au serveur WIMC"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_places(self) -> Dict[str, Any]:
        """Récupère toutes les locations de tous les enfants"""
        if not self.token:
            return {"success": False, "error": "Non authentifié - utilise d'abord login()"}

        try:
            response = requests.get(
                f"{self.base_url}/places/",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 401:
                return {"success": False, "error": "Token expiré ou invalide"}
            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}

            return {"success": True, "data": response.json()}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Impossible de se connecter au serveur WIMC"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_place(self, location_id: int) -> Dict[str, Any]:
        """Récupère une location spécifique"""
        if not self.token:
            return {"success": False, "error": "Non authentifié - utilise d'abord login()"}

        try:
            response = requests.get(
                f"{self.base_url}/places/{location_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 401:
                return {"success": False, "error": "Token expiré ou invalide"}
            if response.status_code == 404:
                return {"success": False, "error": f"Location {location_id} non trouvée"}
            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}

            return {"success": True, "data": response.json()}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Impossible de se connecter au serveur WIMC"}
        except Exception as e:
            return {"success": False, "error": str(e)}
