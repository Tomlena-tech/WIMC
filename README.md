# W.I.M.C - Web Interface for Map Coordinates

## Description
Application de géolocalisation intelligente intégrant Claude AI via Model Context Protocol (MCP).

## Stack Technique
- **Backend:** FastAPI (Python 3.13)
- **Database:** PostgreSQL 16
- **AI:** Claude AI via MCP
- **Auth:** JWT + bcrypt
- **Tests:** pytest


## 📐 Architecture

┌─────────────────────────────────────────┐
│   CLIENT (Navigateur / Mobile App)      │
└─────────────────┬───────────────────────┘
                  │ HTTP/JSON
                  ▼
┌─────────────────────────────────────────┐
│   FASTAPI (Python Backend)              │
│   - Routes (auth, users, locations)     │
│   - Business Logic                       │
│   - Pydantic Validation                 │
└─────────────────┬───────────────────────┘
                  │ SQLAlchemy ORM
                  ▼
┌─────────────────────────────────────────┐
│   POSTGRESQL 16 (Database)              │
│   - users                               │
│   - children                            │
│   - locations                           │
│   - safe_zones                          │
└─────────────────────────────────────────┘


## Installation

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

## Git Workflow

- `main` - Production
- `develop` - Intégration
- `feature/*` - Nouvelles fonctionnalités

## Auteur
**Thomas** - Holberton School Bordeaux - Trimestre 3 - 2026

## Sprints
- Sprint 0: Setup (21-27 janv)
- Sprint 1: Auth JWT (28 janv - 3 fév)
- Sprint 2: CRUD Lieux (3-9 fév)
- Sprint 3: MCP + Claude (10-20 fév)

## 📱 Mobile App (React Native)
- **Frontend:** React Native + Expo
- **Features:** Login, Children list, Map view, Settings
- **Auth:** JWT tokens with SecureStore
- **Maps:** Google Maps integration

## 🏗️ Clean Architecture
```
app/
├── routes/         # API endpoints (orchestration)
├── services/       # Business logic
├── models/         # Database models (SQLAlchemy)
├── schemas/        # Validation (Pydantic)
└── core/           # Security, database config
```

## 🚀 Installation

### Backend
```bash
cd ~/WIMC
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile
```bash
cd ~/WIMC/mobile
npm install
npx expo start --dev-client
```

## ✅ Features Completed
- [x] JWT Authentication (login/register)
- [x] CRUD Children
- [x] CRUD Locations with geolocation
- [x] Mobile app with Google Maps
- [x] MCP integration with Claude AI
- [x] Clean Architecture refactoring
