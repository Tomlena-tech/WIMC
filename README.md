# W.I.M.C - Web Interface for Map Coordinates

## 🎯 Description
Application de géolocalisation intelligente intégrant Claude AI via Model Context Protocol (MCP).

## 🛠️ Stack Technique
- **Backend:** FastAPI (Python 3.13)
- **Database:** PostgreSQL 16
- **AI:** Claude AI via MCP
- **Auth:** JWT + bcrypt
- **Tests:** pytest

## 📦 Installation

### Prérequis
- Python 3.10+
- Docker
- Git

### Setup

1. **Clone le repo**
```bash
git clone https://github.com/Tomlena-tech/WIMC.git
cd WIMC
```

2. **Environnement virtuel**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **Dépendances**
```bash
pip install -r requirements.txt
```

4. **PostgreSQL (Docker)**
```bash
docker run --name wimc-postgres \
  -e POSTGRES_PASSWORD=wimc2026 \
  -e POSTGRES_USER=wimc \
  -e POSTGRES_DB=wimc_db \
  -p 5432:5432 \
  -d postgres:16
```

5. **Lancer l'app**
```bash
uvicorn app.main:app --reload
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## 🌿 Git Workflow

- `main` - Production
- `develop` - Intégration
- `feature/*` - Nouvelles fonctionnalités

## 👨‍💻 Auteur
**Thomas** - Holberton School Bordeaux - Trimestre 3 - 2026

## 🚀 Sprints
- Sprint 0: Setup (21-27 janv)
- Sprint 1: Auth JWT (28 janv - 3 fév)
- Sprint 2: CRUD Lieux (3-9 fév)
- Sprint 3: MCP + Claude (10-20 fév)
