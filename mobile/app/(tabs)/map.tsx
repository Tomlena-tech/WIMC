import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '@/constants/Colors';
import { getChildren, getPlaces, Child, Location } from '@/services/api';

export default function MapScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  // TODO: Remplacer par auth réelle
  const TOKEN = 'YOUR_JWT_TOKEN_HERE';  // TODO: Replace with actual token
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [childrenData, locationsData] = await Promise.all([
        getChildren(TOKEN),
        getPlaces(TOKEN),
      ]);
      
      setChildren(childrenData);
      setLocations(locationsData);
      
      // Centrer sur la position actuelle (dernière location)
      if (locationsData.length > 0) {
        const sortedLocations = [...locationsData].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        centerOnLocation(sortedLocations[0]);
      }
    } catch (err) {
      console.error('Erreur:', err);
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
  const getCurrentPosition = (childId: number) => {
    const childLocations = locations.filter(loc => loc.child_id === childId);
    if (childLocations.length === 0) return null;
    
    childLocations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return childLocations[0]; // La plus récente
  };

  // Trouver toutes les zones de confiance (sauf position actuelle)
  const getSafeZones = (childId: number) => {
    const currentPosition = getCurrentPosition(childId);
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
      const currentPosition = getCurrentPosition(child.id);
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
        {children.map((child) => {
          const currentPosition = getCurrentPosition(child.id);
          const safeZones = getSafeZones(child.id);
          
          if (!currentPosition) return null;
          
          const inSafeZone = isInSafeZone(currentPosition, safeZones);

          return (
            <React.Fragment key={child.id}>
              {/* Zones de confiance (cercles verts) */}
              {safeZones.map((zone) => (
                <React.Fragment key={zone.id}>
                  {/* Cercle de sécurité */}
                  <Circle
                    center={{
                      latitude: zone.latitude,
                      longitude: zone.longitude,
                    }}
                    radius={200} // 200 mètres
                    fillColor="rgba(76, 175, 80, 0.2)" // Vert transparent
                    strokeColor={Colors.light.success}
                    strokeWidth={2}
                  />
                  
                  {/* Marqueur zone (petit point) */}
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

              {/* Position actuelle de l'enfant (Gabbychat) */}
              <Marker
  coordinate={{
    latitude: currentPosition.latitude,
    longitude: currentPosition.longitude,
  }}
  title={child.name}
  description={`${currentPosition.name} - ${new Date(currentPosition.created_at).toLocaleString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`}
  image={require('@/assets/images/Gabby.png')}
  anchor={{ x: 0.5, y: 1 }}
/>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Bouton recentrer */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          const firstChild = children[0];
          if (firstChild) {
            const currentPos = getCurrentPosition(firstChild.id);
            if (currentPos) centerOnLocation(currentPos);
          }
        }}
      >
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Badge sécurité */}
      {children.length > 0 && (
        <View style={styles.safeBadge}>
          <View style={[
            styles.safeDot,
            { backgroundColor: safeCount === children.length ? Colors.light.success : Colors.light.warning }
          ]} />
          <Text style={styles.safeText}>
            {safeCount === children.length ? `${safeCount} en sécurité` : `Attention`}
          </Text>
        </View>
      )}
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
  // Marqueur position actuelle (Gabbychat)
  currentPositionMarker: {
    borderRadius: 30,
    width: 60,
    height: 60,
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
