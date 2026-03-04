# W.I.M.C — Where Is My Child 🛰️

> Application de géolocalisation intelligente pour parents, avec intégration Claude AI via Model Context Protocol (MCP).

**Thomas Decourt — Holberton School Bordeaux — Trimestre 3 — 2026**

[![Python](https://img.shields.io/badge/Python-3.13-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-46%20passed-brightgreen)](https://pytest.org)
[![Deployed](https://img.shields.io/badge/Deployed-Fly.io-purple)](https://wimc-backup.fly.dev)

---

## 🌍 Production

| Composant | URL |
|-----------|-----|
| 🚀 Backend API | https://wimc-backup.fly.dev |
| 📖 Swagger UI | https://wimc-backup.fly.dev/docs |
| 🗄️ Base de données | PostgreSQL — Fly.io |
| 📱 APK Android | https://expo.dev/accounts/thomasdecourt/projects/wimc/builds/56b13488-fcb5-49ac-a3a8-807bd373e893 |

---

## 🎯 Concept

Un parent installe l'app sur son Android. L'iPhone de l'enfant tourne en arrière-plan et envoie sa position GPS toutes les 10 secondes. Le parent voit la position en temps réel sur une carte et peut interroger **Claude AI en langage naturel** :

> 💬 *"Où est ma fille ?"*
> 🤖 *"Léna est à l'École Holberton (44.8430 / -0.5555), batterie 85%, dans sa zone de sécurité ✅"*

---

## 📐 Architecture

```
[iPhone GPS Emitter — Expo iOS]
        ↓  POST /api/gps/children/{id}/update (toutes les 10s)
[FastAPI Backend — Fly.io | wimc-backup.fly.dev]
        ↓                         ↓
[PostgreSQL DB — Fly.io]    [MCP Server — local Mac]
                                        ↓
                               [Claude AI — Anthropic]
                                        ↓
                            [Parent Mobile App — Expo Android]
```

---

## 🗄️ Schéma Base de Données

```
User (id, username, email, hashed_password)
  │  1 → N
  ↓
Child (id, parent_id FK, name, last_latitude, last_longitude, battery, last_update)
  ├── 1→N → Location     (id, child_id FK, name, latitude, longitude, radius)
  └── 1→N → GPSHistory   (id, child_id FK, latitude, longitude, battery, timestamp)
```

> **Double écriture GPS** : position courante sur `Child` (accès O(1)) + historique dans `GPSHistory`.
> **Sous-échantillonnage** : 1 point / 30s → 2 880 pts/jour au lieu de 86 400.

---

## 🛠️ Stack Technique

| Composant | Technologie | Pourquoi |
|-----------|-------------|----------|
| Backend | FastAPI (Python 3.13) | Async, Swagger auto, Pydantic intégré |
| Base de données | PostgreSQL 16 — Fly.io | ACID, Foreign Keys, robuste |
| Auth | JWT + bcrypt | Stateless, irréversible, industrie standard |
| Distance GPS | Formule Haversine (Python) | PostGIS overkill pour MVP |
| IA | Claude AI via MCP | Réponses contextuelles en français |
| Mobile | React Native / Expo | Cross-platform iOS + Android |
| GPS Background | expo-task-manager | Tracking iPhone en veille |
| Tests | pytest — SQLite in-memory | Isolation complète prod |
| Déploiement | Fly.io | Docker, PostgreSQL persistant |

---

## 🏗️ Structure du Code

```
app/
├── main.py              ← Point d'entrée FastAPI
├── models/              ← SQLAlchemy ORM (User, Child, Location, GPSHistory)
├── schemas/             ← Pydantic validation (Create / Update / Response)
├── routes/              ← Endpoints HTTP (auth, children, places, gps)
├── services/            ← Logique métier (auth, gps, haversine...)
├── core/                ← DB session, config, sécurité JWT
└── tests/               ← 46 tests pytest (SQLite in-memory)

mobile/                  ← App parent React Native/Expo
wimc_gps_emitter/        ← App GPS iPhone
mcp_server/
└── tools.py             ← Serveur MCP FastMCP (Claude AI)
```

---

## ⚙️ Installation

### Backend

```bash
git clone https://github.com/Tomlena-tech/WIMC.git
cd WIMC
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Fichier `.env` :
```env
DATABASE_URL=postgresql://wimc:wimc2026@localhost:5432/wimc_db
SECRET_KEY=your_secret_key
```

```bash
uvicorn app.main:app --reload
# API : http://localhost:8000
# Docs : http://localhost:8000/docs
```

### Mobile (App parent)

```bash
cd mobile
npm install
npx expo start --tunnel
```

### GPS Emitter (iPhone)

```bash
cd wimc_gps_emitter
npm install
npx expo start --tunnel
```

### Serveur MCP (Claude AI)

```bash
# Fichier .env.mcp requis avec credentials
cd mcp_server
python3 tools.py
```

---

## 🔌 API — Exemples

### Authentification

```bash
# Register
curl -X POST https://wimc-backup.fly.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "thomas", "email": "thomas@example.com", "password": "secret"}'

# Login → récupère le JWT
curl -X POST https://wimc-backup.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "thomas@example.com", "password": "secret"}'
```

### GPS Tracking

```bash
# Envoyer position GPS (depuis iPhone)
curl -X POST https://wimc-backup.fly.dev/api/gps/children/1/update \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 44.8430, "longitude": -0.5555, "battery": 85}'

# Dernière position
curl https://wimc-backup.fly.dev/api/gps/children/1/last-position \
  -H "Authorization: Bearer <token>"

# Vérifier safe zone
curl https://wimc-backup.fly.dev/api/gps/children/1/in-safe-zone \
  -H "Authorization: Bearer <token>"
```

### Test MCP (Claude AI)

```bash
python3 -c "
from mcp_server.tools import WIMCTools
t = WIMCTools()
t.login('youremail', 'your password')
print(t.get_last_position(1))
"
```

**Résultat ✅ :**
```json
{
  "success": true,
  "data": {
    "child_id": 1,
    "latitude": 44.84321017684419,
    "longitude": -0.5558976348711683,
    "last_update": "2026-03-04T12:23:16",
    "battery": 85
  }
}
```

---

## ✅ Tests

```bash
DATABASE_URL="sqlite:///./test.db" pytest -v
```

**46 tests passés ✅ — 0 failed**

| Fichier | Tests | Couverture |
|---------|-------|------------|
| test_auth.py | 7 | Register, Login, JWT, validation |
| test_child.py | 6 | CRUD enfants, ownership parent |
| test_location.py | 6 | CRUD zones, sécurité |
| test_location_advanced.py | 11 | Haversine, safe zones avancées |
| test_healthy.py | 2 | Health check API |
| test_gps_service.py | 14 | GPS update, historique, zones |

> **Isolation** : SQLite in-memory via `conftest.py` — complètement indépendant de la production.

---

## 🔒 Sécurité

- **bcrypt** : mots de passe hachés irréversiblement avec salt unique — jamais en clair en DB
- **JWT stateless** : access token (7j) + refresh token (30j) — serveur ne stocke rien
- **Ownership chain** : User → Child → Location vérifiée à chaque requête via JWT
- **No user enumeration** : même message d'erreur si email inconnu ou mot de passe incorrect

---

## 📊 Métriques Projet

| Métrique | Valeur |
|----------|--------|
| 📝 Commits GitHub | 73 |
| 🐍 Fichiers Python | 34 |
| ⏱️ Heures de développement | ~85h |
| ✅ Tests automatisés | 46 passés |
| 🏃 Sprints livrés | 5/5 |
| 🐛 Bugs critiques résolus | 6/6 |

---

## 🌿 Git Workflow

```
main        ← Production (Fly.io deploy)
develop     ← Intégration
feature/*   ← Nouvelles fonctionnalités
```

Convention : `feat:`, `fix:`, `docs:`, `refactor:`

---

## ✅ Features Livrées

- [x] Authentification JWT + bcrypt
- [x] CRUD Children + Locations avec sécurité ownership
- [x] Formule Haversine — calcul safe zone
- [x] GPS tracking temps réel
- [x] Historique GPS journalier (sous-échantillonnage 30s)
- [x] Background GPS tracking iOS
- [x] Claude AI via MCP — questions en langage naturel
- [x] Déploiement Fly.io + PostgreSQL persistant
- [x] App mobile React Native (carte, historique, login)
- [x] Test réel iPhone 12 en 4G ✅

## 🔮 Backlog V2.0

- [ ] Fix warning Pydantic V2 (`.dict()` → `.model_dump()`)
- [ ] `loadAvailableDays` : remplacer `childId: 1` hardcodé
- [ ] WebSocket temps réel
- [ ] Déploiement serveur MCP sur Fly.io
- [ ] PostGIS pour requêtes spatiales avancées
- [ ] Notifications push

---

*W.I.M.C — Thomas Decourt — Holberton School Bordeaux — 2026*
