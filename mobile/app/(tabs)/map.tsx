import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Colors } from '@/constants/Colors';
import { getChildren, getPlaces, Child, Location, getAllChildrenGPSPositions } from '@/services/api';

type GPSPosition = {
  child_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function MapScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [locations, setLocations] = useState<Location[]>([]); // Zones de confiance uniquement
  const [gpsPositions, setGpsPositions] = useState<GPSPosition[]>([]);
  const [gpsHistory, setGpsHistory] = useState<GPSPosition[]>([]); // 📍 Historique local
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false); // 🔄 Toggle affichage historique
  const mapRef = useRef<MapView>(null);

  // 🔄 Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  // 🔄 Polling GPS toutes les 10 secondes (seulement si des enfants sont chargés)
  useEffect(() => {
    if (children.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const gpsData = await getAllChildrenGPSPositions();
        console.log('🔄 GPS refresh:', gpsData);
        setGpsPositions(gpsData);

        // 📍 Ajouter au début de l'historique (éviter doublons)
        setGpsHistory(prev => {
          const newPositions = gpsData.filter(
            newPos => !prev.some(
              oldPos => 
                oldPos.child_id === newPos.child_id && 
                oldPos.timestamp === newPos.timestamp
            )
          );
          return [...newPositions, ...prev].slice(0, 100); // Garde 100 dernières
        });

      } catch (err) {
        console.error('Erreur refresh GPS:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [children]);

  // 🎯 Centrer sur position de Léna si GPS disponible
  useEffect(() => {
    if (gpsPositions.length > 0 && !loading) {
      const firstChildGPS = gpsPositions.find(gps => gps.latitude !== null);
      if (firstChildGPS) {
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: firstChildGPS.latitude,
            longitude: firstChildGPS.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }, 500);
      }
    }
  }, [gpsPositions, loading]);

  // 📡 Chargement données
  const loadData = async () => {
    try {
      // ✅ Vérifier qu'on est connecté AVANT de faire les appels API
      const { isAuthenticated } = await import('@/services/auth');
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        setLoading(false);
        return;
      }

      const [childrenData, locationsData] = await Promise.all([
        getChildren(),
        getPlaces(), // Zones de confiance uniquement
      ]);

      setChildren(childrenData);
      setLocations(locationsData);

      // 📍 Charger positions GPS
      const gpsData = await getAllChildrenGPSPositions();
      console.log('📍 GPS reçu:', gpsData);
      setGpsPositions(gpsData);

      // 📍 Initialiser historique
      setGpsHistory(gpsData);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📍 Trouver la position GPS actuelle d'un enfant
  const getCurrentGPSPosition = (childId: number) => {
    return gpsPositions.find(gps => gps.child_id === childId && gps.latitude !== null);
  };

  // 🏠 Trouver les zones de confiance d'un enfant (uniquement locations, pas GPS)
  const getSafeZones = (childId: number) => {
    return locations.filter(loc => loc.child_id === childId);
  };

  // ✅ Vérifier si position GPS est dans une zone sûre
  const isInSafeZone = (gpsPosition: GPSPosition, safeZones: Location[]) => {
    const SAFE_RADIUS_KM = 0.2; // 200 mètres

    for (const zone of safeZones) {
      const distance = getDistanceKm(
        gpsPosition.latitude,
        gpsPosition.longitude,
        zone.latitude,
        zone.longitude
      );

      if (distance <= SAFE_RADIUS_KM) return true;
    }

    return false;
  };

  // 📏 Calcul distance entre 2 points (formule Haversine)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🔢 Compter enfants en sécurité
  const countSafe = () => {
    let safe = 0;
    children.forEach(child => {
      const currentPosition = getCurrentGPSPosition(child.id);
      if (!currentPosition) return;

      const safeZones = getSafeZones(child.id);
      if (isInSafeZone(currentPosition, safeZones)) {
        safe++;
      }
    });
    return safe;
  };

  // 📍 Récupérer l'historique d'un enfant (pour tracer le parcours)
  const getChildHistory = (childId: number) => {
    return gpsHistory
      .filter(gps => gps.child_id === childId && gps.latitude !== null)
      .slice(0, 20); // Garde 20 derniers points
  };

  const safeCount = countSafe();

  // 🔄 Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WIMC</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  const firstGPS = gpsPositions.find(gps => gps.latitude !== null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WIMC</Text>
        <View style={styles.statusDot} />
        <Text style={styles.headerSubtitle}>En ligne</Text>
      </View>

      {/* Carte Google Maps */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: firstGPS?.latitude || 44.8566,
          longitude: firstGPS?.longitude || -0.5522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* 🏠 Zones de confiance (cercles verts) */}
        {children.map((child) => {
          const safeZones = getSafeZones(child.id);

          return (
            <React.Fragment key={`zones-${child.id}`}>
              {safeZones.map((zone) => (
                <React.Fragment key={zone.id}>
                  <Circle
                    center={{
                      latitude: zone.latitude,
                      longitude: zone.longitude,
                    }}
                    radius={200}
                    fillColor="rgba(76, 175, 80, 0.2)"
                    strokeColor={Colors.light.success}
                    strokeWidth={2}
                  />
                  <Marker
                    coordinate={{
                      latitude: zone.latitude,
                      longitude: zone.longitude,
                    }}
                    title={zone.name}
                    description="Zone de confiance"
                  >
                    <View style={styles.zoneMarker}>
                      <Text style={styles.zoneMarkerText}>🏠</Text>
                    </View>
                  </Marker>
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}

        {/* 📍 Historique parcours (lignes bleues) */}
        {showHistory && children.map((child) => {
          const history = getChildHistory(child.id);
          if (history.length < 2) return null;

          return (
            <Polyline
              key={`history-${child.id}`}
              coordinates={history.map(gps => ({
                latitude: gps.latitude,
                longitude: gps.longitude,
              }))}
              strokeColor={Colors.light.primary}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          );
        })}

        {/* 📍 Marqueurs GPS temps réel (Gabby/Léna) */}
        {children.map((child) => {
          const currentPosition = getCurrentGPSPosition(child.id);
          if (!currentPosition) return null;

          const safeZones = getSafeZones(child.id);
          const isSafe = isInSafeZone(currentPosition, safeZones);

          return (
            <Marker
              key={`gps-${child.id}`}
              coordinate={{
                latitude: currentPosition.latitude,
                longitude: currentPosition.longitude,
              }}
              title={child.name}
              description={`GPS - ${new Date(currentPosition.timestamp).toLocaleString('fr-FR')}`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                {/* HALO rouge si hors zone */}
                {!isSafe && (
                  <View
                    style={{
                      position: "absolute",
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "rgba(255,0,0,0.25)",
                    }}
                  />
                )}
                <Image
                  source={require('@/assets/images/Gabby.png')}
                  style={{ width: 40, height: 40 }}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* 📍 Bouton recentrer */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          const firstGPS = gpsPositions.find(gps => gps.latitude !== null);
          if (firstGPS) {
            mapRef.current?.animateToRegion({
              latitude: firstGPS.latitude,
              longitude: firstGPS.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }}
      >
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* 🔄 Toggle historique */}
      <TouchableOpacity
        style={[styles.historyButton, showHistory && styles.historyButtonActive]}
        onPress={() => setShowHistory(!showHistory)}
      >
        <Text style={styles.centerButtonText}>
          {showHistory ? '🔵' : '⚪'}
        </Text>
      </TouchableOpacity>

      {/* ✅ Badge sécurité */}
      <View style={styles.safeBadge}>
        <View
          style={[
            styles.safeDot,
            { backgroundColor: safeCount === children.length ? Colors.light.success : Colors.light.warning }
          ]}
        />
        <Text style={styles.safeText}>
          {safeCount}/{children.length} en sécurité
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.white,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    marginLeft: 8,
    marginRight: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.white,
  },
  map: {
    flex: 1,
  },
  zoneMarker: {
    backgroundColor: Colors.light.white,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.success,
  },
  zoneMarkerText: {
    fontSize: 16,
  },
  centerButton: {
    position: 'absolute',
    right: 16,
    top: 100,
    backgroundColor: Colors.light.white,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  historyButton: {
    position: 'absolute',
    right: 16,
    top: 160,
    backgroundColor: Colors.light.white,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  historyButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  centerButtonText: {
    fontSize: 24,
  },
  safeBadge: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    backgroundColor: Colors.light.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  safeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  safeText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
