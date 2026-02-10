import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

const API_URL = 'http://10.5.1.110:8000/api/gps'; // ⚠️ REMPLACE PAR TON IP
const CHILD_ID = 1; // ID de l'enfant test en base

export default function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  // Demander permission GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'GPS nécessaire pour fonctionner');
      }
    })();
  }, []);

  // Fonction d'envoi position
  const sendLocation = async (coords) => {
    try {
    console.log('🔍 API_URL:', API_URL);
    console.log('🔍 URL complète:', `${API_URL}/children/${CHILD_ID}/update`);
      const response = await axios.post(
        `${API_URL}/children/${CHILD_ID}/update`,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString()
        }
      );
      console.log('✅ Position envoyée:', response.data);
      setLocation(coords);
    } catch (error) {
      console.error('❌ Erreur envoi:', error.message);
      console.error('❌ URL:', error.config?.url);  // ← AJOUTE CETTE LIGNE

      Alert.alert('Erreur', 'Impossible d\'envoyer la position');
    }
  };

  // Démarrer tracking
  const startTracking = async () => {
    try {
      // Première position immédiate
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      await sendLocation(currentLocation.coords);

      // Puis toutes les 10 secondes
      const id = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        await sendLocation(loc.coords);
      }, 10000); // 10 secondes

      setIntervalId(id);
      setIsTracking(true);
      Alert.alert('Démarré', 'Émission GPS active 📡');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  // Arrêter tracking
  const stopTracking = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setIsTracking(false);
      Alert.alert('Arrêté', 'Émission GPS stoppée');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📡 GPS Émetteur WIMC</Text>
      <Text style={styles.subtitle}>Simule téléphone enfant</Text>

      {location && (
        <View style={styles.locationBox}>
          <Text style={styles.locationText}>
            📍 Lat: {location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            📍 Lon: {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.buttonText}>
          {isTracking ? '⏹ STOP' : '▶️ START'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.status}>
        {isTracking ? '🟢 Émission active (10s)' : '🔴 Arrêté'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 40,
  },
  locationBox: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
  },
  locationText: {
    color: '#0f4c75',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 50,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#00d9ff',
  },
  stopButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  status: {
    fontSize: 16,
    color: '#aaa',
  },
});
