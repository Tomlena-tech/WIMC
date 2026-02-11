import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '@/constants/Colors';
import { getChildren, getPlaces, Child, Location, getAllChildrenGPSPositions, getChildGPSPosition } from '@/services/api';

export default function MapScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [gpsPositions, setGpsPositions] = useState<any[]>([]); //utilise position Iphone
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  
  useEffect(() => {
    loadData();
  }, []);
// 🆕 Polling GPS toutes les 10 secondes (seulement si des enfants sont chargés)
  useEffect(() => {
  if (children.length === 0) return;

  const interval = setInterval(async () => {
    try {
      const gpsData = await getAllChildrenGPSPositions();
      console.log('🔄 GPS refresh:', gpsData);
      setGpsPositions(gpsData);
    } catch (err) {
      console.error('Erreur refresh GPS:', err);
    }
  }, 10000);

  return () => clearInterval(interval);
}, [children]);
// centre la pisition de Léna si GPS available
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
        getPlaces(),
      ]);

      
      setChildren(childrenData);
      setLocations(locationsData);

      // 🆕 Charger positions GPS
      const gpsData = await getAllChildrenGPSPositions();
      console.log('📍 GPS reçu:', gpsData);
      setGpsPositions(gpsData);
            
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const centerOnLocation = (location: Location) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
  };

  // Trouver la position actuelle (dernière location) pour chaque enfant
  const getCurrentGPSPosition = (childId: number) => {
   //cherche dans le GPS (positions)
   return gpsPositions.find(gps => gps.child_id ===childId && gps.latitude !== null);
  };

  // Trouver toutes les zones de confiance (sauf position actuelle)
  const getSafeZones = (childId: number) => {
    const currentPosition = getCurrentGPSPosition(childId);
    if (!currentPosition) return [];
    
    return locations.filter(loc => 
      loc.child_id === childId && loc.id !== currentPosition.id
    );
  };

  // Vérifier si position actuelle est dans une zone sûre
  const isInSafeZone = (currentPosition: Location, safeZones: Location[]) => {
    const SAFE_RADIUS_KM = 0.2; // 200 mètres
    
    for (const zone of safeZones) {
      const distance = getDistanceKm(
        currentPosition.latitude,
        currentPosition.longitude,
        zone.latitude,
        zone.longitude
      );
      
      if (distance <= SAFE_RADIUS_KM) return true;
    }
    
    return false;
  };

  // Calcul distance entre 2 points (formule Haversine)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Compter enfants en sécurité
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

  const safeCount = countSafe();

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

  const firstLocation = locations.length > 0 ? locations[0] : null;

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
          latitude: firstLocation?.latitude || 44.8566,
          longitude: firstLocation?.longitude || -0.5522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Pour chaque enfant */}
        {/* Zones de confiance pour chaque enfant */}
        {children.map((child) => {
          const currentPosition = getCurrentGPSPosition(child.id);
          const safeZones = getSafeZones(child.id);

          if (!currentPosition) return null;

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

        {/* Marqueurs GPS temps réel GABBY / LENA (indépendants des places) */}
        {children.map((child) => {
          const currentPosition = getCurrentGPSPosition(child.id);
          const safeZones = getSafeZones(child.id);
          const isSafe = currentPosition && isInSafeZone(currentPosition, safeZones);

          return gpsPositions
            .filter(gps => gps && gps.child_id === child.id && gps.latitude !== null)
            .map((gps) => (
              <Marker
                key={`gps-${child.id}`}
                coordinate={{
                  latitude: gps.latitude,
                  longitude: gps.longitude,
                }}
                title={child.name}
                description={`GPS - ${new Date(gps.last_update).toLocaleString('fr-FR')}`}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                <View style={{alignItems: "center", justifyContent: "center" ,}}>
                  {/* HALO */}
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
                    style={{ width: 40, height: 40}}
                  />
                </View>
              </Marker>
            ));
        })}
      </MapView>

      {/* Bouton ROUGE pour s'auto-recentrer */}
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
            }, 1000)
          }
        }}
      >
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>
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
  statusDot: { //Bouton status en ligne ou pas !
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
  // Marqueur position actuelle (Gabbychat)
  currentPositionMarker: {
    borderRadius: 30,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.light.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  currentPositionEmoji: {
    fontSize: 32,
  },
  // Marqueur zone de confiance (petit)
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
