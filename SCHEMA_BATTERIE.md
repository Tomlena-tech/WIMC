# 🔋 Schéma Flux Batterie WIMC

## Vue d'ensemble
```
iPhone (émetteur) → Backend FastAPI → PostgreSQL → App Android (parent)
```

---

## 📊 Flux Détaillé

### 1️⃣ iPhone (Émetteur GPS)
**Fichier:** `wimc_gps_emitter/App.js`

**Actions:**
- Lit la batterie: `Battery.getBatteryLevelAsync()` → 0.85 (85%)
- Envoie via axios.post toutes les 10 secondes

**Données envoyées:**
```json
{
  "latitude": 44.84,
  "longitude": -0.55,
  "timestamp": "2026-02-13T11:34:06Z",
  "battery": 85
}
```

---

### 2️⃣ Backend - Route GPS
**Fichier:** `app/routes/gps_tracking.py`

**Endpoint:**
```
POST /api/gps/children/{child_id}/update
```

**Schema validation:** `GPSUpdate` (Pydantic)
- ✅ latitude: float
- ✅ longitude: float
- ✅ timestamp: str
- ✅ battery: Optional[int]

---

### 3️⃣ Backend - Service GPS
**Fichier:** `app/services/gps_service.py`

**Fonction:** `update_child_gps()`

**Actions:**
```python
child.last_latitude = gps_data.latitude
child.last_longitude = gps_data.longitude
child.last_update = datetime(...)
child.battery = gps_data.battery  # ← NOUVEAU
db.commit()
```

---

### 4️⃣ Base de Données PostgreSQL
**Table:** `children`

**Colonnes mises à jour:**
- `last_latitude` = 44.84
- `last_longitude` = -0.55
- `last_update` = 2026-02-13 11:34:06
- `battery` = 85 ← NOUVEAU

---

### 5️⃣ App Parent - Récupération
**Fichier:** `mobile/app/(tabs)/index.tsx`

**API Call:**
```
GET /children/
```

**Données reçues:** `ChildResponse`
```json
{
  "id": 1,
  "name": "Gabby",
  "battery": 85,
  "last_latitude": 44.84,
  "last_longitude": -0.55
}
```

---

### 6️⃣ App Parent - Affichage
**Fichier:** `mobile/components/ChildCard.tsx`

**Code d'affichage:**
```typescript
<View style={batteryBar}>
  width: {child.battery}%  // 85%
</View>
<Text>{child.battery}%</Text>  // "85%"
```

**Résultat visuel:**
```
████████████████████░░░░  85%
```

---

## 🔄 Cycle de Mise à Jour

**Fréquence:** Toutes les 10 secondes
```
┌─────────────────────────────────┐
│ 1. iPhone lit batterie          │
│    ↓ (10s interval)             │
│ 2. Envoie au Backend            │
│    ↓ (instant)                  │
│ 3. Backend sauvegarde en DB     │
│    ↓ (instant)                  │
│ 4. App parent rafraîchit        │
│    ↓ (instant)                  │
│ 5. Affichage mis à jour         │
└─────────────────────────────────┘
```

---

## 📁 Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `wimc_gps_emitter/App.js` | Ajout lecture batterie + envoi |
| `app/schemas/gps.py` | Ajout champ `battery` dans schemas |
| `app/services/gps_service.py` | Sauvegarde + retour battery |
| `mobile/components/ChildCard.tsx` | Affichage (déjà existant) |

---

## 💡 Points Clés

1. **Architecture simple** : Un seul flux unidirectionnel
2. **Pas de table GPS séparée** : Données stockées dans `children`
3. **Temps réel** : Mise à jour automatique toutes les 10s
4. **Type-safe** : Validation Pydantic côté backend
5. **React Native** : Affichage natif avec barre de progression

---

## 🔧 Technologies Utilisées

- **iPhone:** React Native + Expo + expo-battery
- **Backend:** FastAPI + SQLAlchemy + Pydantic
- **Database:** PostgreSQL
- **App Parent:** React Native + TypeScript + Axios
