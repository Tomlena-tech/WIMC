import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import axios from 'axios';
import { useKeepAwake } from 'expo-keep-awake';


const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/gps`;

export default function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [childId, setChildId] = useState(null);
  const [inputId, setInputId] = useState('');
  useKeepAwake();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'GPS nécessaire pour fonctionner');
      }
    })();
  }, []);

  const sendLocation = async (coords) => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);
      const response = await axios.post(
        `${API_URL}/children/${childId}/update`,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString(),
          battery: batteryPercent
        }
      );
      console.log('✅ Position envoyée:', response.data);
      setLocation(coords);
    } catch (error) {
      console.error('❌ Erreur envoi:', error.message);
      Alert.alert('Erreur', 'Impossible d\'envoyer la position');
    }
  };

  const startTracking = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      await sendLocation(currentLocation.coords);
      const id = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        await sendLocation(loc.coords);
      }, 10000);
      setIntervalId(id);
      setIsTracking(true);
      Alert.alert('Démarré', 'Émission GPS active 📡');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const stopTracking = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setIsTracking(false);
      Alert.alert('Arrêté', 'Émission GPS stoppée');
    }
  };

  // Écran de sélection child_id
  if (!childId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📡 GPS Émetteur WIMC</Text>
        <Text style={styles.subtitle}>Entre ton Child ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 1 ou 2"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={inputId}
          onChangeText={setInputId}
        />
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={() => {
            if (!inputId) return Alert.alert('Erreur', 'Entre un ID valide');
            setChildId(parseInt(inputId));
          }}
        >
          <Text style={styles.buttonText}>✅ Confirmer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📡 GPS Émetteur WIMC</Text>
      <Text style={styles.subtitle}>Child ID : {childId}</Text>

      {location && (
        <View style={styles.locationBox}>
          <Text style={styles.locationText}>📍 Lat: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.locationText}>📍 Lon: {location.longitude.toFixed(6)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.buttonText}>{isTracking ? '⏹ STOP' : '▶️ START'}</Text>
      </TouchableOpacity>

      <Text style={styles.status}>
        {isTracking ? '🟢 Émission active (10s)' : '🔴 Arrêté'}
      </Text>

      <TouchableOpacity onPress={() => { stopTracking(); setChildId(null); }}>
        <Text style={{ color: '#aaa', marginTop: 20 }}>🔄 Changer d'ID</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#aaa', marginBottom: 40 },
  input: { backgroundColor: '#16213e', color: '#fff', padding: 15, borderRadius: 10, width: '80%', fontSize: 20, textAlign: 'center', marginBottom: 20 },
  locationBox: { backgroundColor: '#16213e', padding: 20, borderRadius: 10, marginBottom: 30, width: '100%' },
  locationText: { color: '#0f4c75', fontSize: 16, fontFamily: 'monospace' },
  button: { paddingVertical: 20, paddingHorizontal: 60, borderRadius: 50, marginBottom: 20 },
  startButton: { backgroundColor: '#00d9ff' },
  stopButton: { backgroundColor: '#ff6b6b' },
  buttonText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  status: { fontSize: 16, color: '#aaa' },
});

