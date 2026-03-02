import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Colors } from '@/constants/Colors';
import { getChildren, getPlaces, Child, Location, getAllChildrenGPSPositions } from '@/services/api';

type GPSPosition = {
  child_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  last_update?: string;
};

type HistoryPoint = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function MapScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [gpsPositions, setGpsPositions] = useState<GPSPosition[]>([]);
  const [gpsHistory, setGpsHistory] = useState<GPSPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [historyPoints, setHistoryPoints] = useState<{ [childId: number]: HistoryPoint[] }>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const mapRef = useRef<MapView>(null);
  const hasInitializedMap = useRef(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // 🔄 Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  // 🔄 Polling GPS toutes les 10 secondes
  useEffect(() => {
    if (children.length === 0) return;
    const interval = setInterval(async () => {
      try {
        const gpsData = await getAllChildrenGPSPositions();
        setGpsPositions(gpsData);
        setGpsHistory(prev => {
          const newPositions = gpsData.filter(
            newPos => !prev.some(
              oldPos => oldPos.child_id === newPos.child_id && oldPos.timestamp === newPos.timestamp
            )
          );
          return [...newPositions, ...prev].slice(0, 20);
        });
      } catch (err) {
        console.error('Erreur refresh GPS:', err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [children]);

  useEffect(() => {
    if (children.length > 0) {
      loadAvailableDays(1);
    }
  }, [children]);

  // 🎯 Centrer carte au premier chargement
  useEffect(() => {
    if (gpsPositions.length > 0 && !loading && !hasInitializedMap.current) {
      hasInitializedMap.current = true;
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

      const gpsData = await getAllChildrenGPSPositions();
      setGpsPositions(gpsData);
      setGpsHistory(gpsData);

      if (childrenData.length > 0) {
        await loadAvailableDays(1);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📅 Charger les jours disponibles
  const loadAvailableDays = async (childId: number) => {
    try {
      const { getAccessToken } = await import('@/services/auth');
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/gps/children/${childId}/history/days`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const days = await res.json();
      console.log('📅 days reçus:', days);
      setAvailableDays(days);
    } catch (err) {
      console.error('Erreur chargement jours:', err);
    }
  };

  // 📍 Charger historique d'un jour
  const loadHistoryForDay = async (day: string) => {
    setLoadingHistory(true);
    setSelectedDay(day);
    try {
      const { getAccessToken } = await import('@/services/auth');
      const token = await getAccessToken();
      const results: { [childId: number]: HistoryPoint[] } = {};
      await Promise.all(
        children.map(async (child) => {
          const res = await fetch(
            `${API_URL}/api/gps/children/${child.id}/history?day=${day}&interval_seconds=30&snap=false`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const points = await res.json();
          results[child.id] = points.slice(0,200);
        })
      );
      setHistoryPoints(results);

      // Centrer sur le premier point
      const firstChild = children[0];
      const points = results[firstChild?.id];
      if (points && points.length > 0) {
        mapRef.current?.animateToRegion({
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 🔴 Retour en live
  const goLive = () => {
    setShowHistory(false);
    setSelectedDay(null);
    setHistoryPoints({});
    const firstGPS = gpsPositions.find(gps => gps.latitude !== null);
    if (firstGPS) {
      mapRef.current?.animateToRegion({
        latitude: firstGPS.latitude,
        longitude: firstGPS.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // 📍 Position GPS actuelle d'un enfant
  const getCurrentGPSPosition = (childId: number) => {
    const pos = gpsPositions.find(gps => gps.child_id === childId && gps.latitude !== null);
    if (!pos) return null;
    const diffMins = (new Date().getTime() - new Date((pos.last_update ?? pos.timestamp)+ '+00:00').getTime()) / 60000;
    if (diffMins > 1440) return null;
    return pos;
  };

  const getChildImage = (childId: number) => {
    switch (childId) {
      case 1: return require('@/assets/images/Gabby-Dollhouse-Transparent.png');
      case 2: return require('@/assets/images/greg.png');
      default: return require('@/assets/images/Gabby.png');
    }
  };

  const getSafeZones = (childId: number) => locations.filter(loc => loc.child_id === childId);

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isInSafeZone = (gpsPosition: GPSPosition, safeZones: Location[]) => {
    for (const zone of safeZones) {
      if (getDistanceKm(gpsPosition.latitude, gpsPosition.longitude, zone.latitude, zone.longitude) <= zone.radius / 1000) return true;
    }
    return false;
  };

  const countSafe = () => {
    let safe = 0;
    children.forEach(child => {
      const pos = getCurrentGPSPosition(child.id);
      if (pos && isInSafeZone(pos, getSafeZones(child.id))) safe++;
    });
    return safe;
  };

  const formatDay = (day: string) => {
    const [y,m,dd] = day.split("-").map(Number);
    const d = new Date(y, m-1, dd);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const safeCount = countSafe();
  const firstGPS = gpsPositions.find(gps => gps.latitude !== null);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WIMC</Text>
        <View style={styles.statusDot} />
        <Text style={styles.headerSubtitle}>
          {showHistory && selectedDay ? `📅 ${formatDay(selectedDay)}` : '🔴 Live'}
        </Text>
      </View>

      {/* Carte */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType="hybrid"
        initialRegion={{
          latitude: firstGPS?.latitude || 44.8566,
          longitude: firstGPS?.longitude || -0.5522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Zones de confiance */}
        {children.map((child) => (
          <React.Fragment key={`zones-${child.id}`}>
            {getSafeZones(child.id).map((zone) => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={{ latitude: zone.latitude, longitude: zone.longitude }}
                  radius={zone.radius}
                  fillColor="rgba(76, 175, 80, 0.2)"
                  strokeColor={Colors.light.success}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
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
        ))}

        {/* Polylines historique */}
        {showHistory && children.map((child, index) => {
          const points = historyPoints[child.id];
          if (!points || points.length < 2) return null;
          const colors = [Colors.light.primary, '#FF6B35', '#9B59B6', '#27AE60'];
          return (
            <Polyline
              key={`history-${child.id}`}
              coordinates={points.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={colors[index % colors.length]}
              strokeWidth={4}
            />
          );
        })}

        {/* Marqueurs GPS live */}
        {!showHistory && children.map((child) => {
          const pos = getCurrentGPSPosition(child.id);
          if (!pos) return null;
          return (
            <Marker
              key={`gps-${child.id}`}
              coordinate={{ latitude: pos.latitude, longitude: pos.longitude }}
              title={child.name}
              description={`GPS - ${new Date((pos.last_update ?? pos.timestamp) + '+00:00').toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image source={getChildImage(child.id)} style={{ width: 40, height: 40 }} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Bouton recentrer */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          const pos = gpsPositions.find(gps => gps.latitude !== null);
          if (pos) {
            mapRef.current?.animateToRegion({
              latitude: pos.latitude,
              longitude: pos.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }}
      >
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Bouton Live (visible seulement en mode historique) */}
      {showHistory && (
        <TouchableOpacity style={styles.liveButton} onPress={goLive}>
          <Text style={styles.liveButtonText}>🔴 Live</Text>
        </TouchableOpacity>
      )}

      {/* Badge sécurité */}
      <View style={styles.safeBadge}>
        <View style={[styles.safeDot, { backgroundColor: safeCount === children.length ? Colors.light.success : Colors.light.warning }]} />
        <Text style={styles.safeText}>{safeCount}/{children.length} en sécurité</Text>
      </View>

      {/* Bandeau dates */}
      <View style={styles.historyBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
          <TouchableOpacity
            style={[styles.dayButton, !showHistory && styles.dayButtonActive]}
            onPress={goLive}
          >
            <Text style={[styles.dayButtonText, !showHistory && styles.dayButtonTextActive]}>🔴 Live</Text>
          </TouchableOpacity>

          {availableDays.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, selectedDay === day && showHistory && styles.dayButtonActive]}
              onPress={() => {
                setShowHistory(true);
                loadHistoryForDay(day);
              }}
            >
              {loadingHistory && selectedDay === day
                ? <ActivityIndicator size="small" color={Colors.light.white} />
                : <Text style={[styles.dayButtonText, selectedDay === day && showHistory && styles.dayButtonTextActive]}>
                    {formatDay(day)}
                  </Text>
              }
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.white },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FF00', marginLeft: 8, marginRight: 4 },
  headerSubtitle: { fontSize: 14, color: Colors.light.white },
  map: { flex: 1 },
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
  zoneMarkerText: { fontSize: 16 },
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
  centerButtonText: { fontSize: 24 },
  liveButton: {
    position: 'absolute',
    right: 16,
    top: 160,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  liveButtonText: { color: Colors.light.white, fontWeight: 'bold', fontSize: 14 },
  safeBadge: {
    position: 'absolute',
    bottom: 110,
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
  safeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  safeText: { fontSize: 15, color: Colors.light.text, fontWeight: '600' },
  historyBar: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 8,
  },
  historyScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 70,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayButtonText: { color: Colors.light.white, fontSize: 13, fontWeight: '500' },
  dayButtonTextActive: { fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
