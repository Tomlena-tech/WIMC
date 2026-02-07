import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { clearTokens } from '@/services/auth';
import { Colors } from '@/constants/Colors';
import axios from 'axios';

export default function SettingsScreen() {
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Données utilisateur (à récupérer depuis l'API plus tard)
  const userEmail = 'decourtthomas@orange.fr';
  const userName = 'Thomas Decourt';

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      // Météo pour Bordeaux (Stage 1)
      const response = await axios.get(
        'https://api.open-meteo.com/v1/forecast?latitude=44.84&longitude=-0.58&current_weather=true&timezone=Europe/Paris'
      );
      setWeather(response.data.current_weather);
    } catch (error) {
      console.error('Erreur météo:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleLogout = () => {
  Alert.alert(
    'Déconnexion',
    'Voulez-vous vraiment vous déconnecter ?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          console.log('🔴 Déconnexion');

          await new Promise(resolve => setTimeout(resolve, 100));// idem login attends un peu que ca se stocke

          router.replace('/login');
        },
      },
    ]
  );
};

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌧️';
    return '⛈️';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      {/* Section Profil */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profil</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.profileRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{userEmail}</Text>
          </View>
        </View>
      </View>

      {/* Section Météo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌤️ Météo Locale</Text>
        <View style={styles.card}>
          {loadingWeather ? (
            <ActivityIndicator size="large" color={Colors.light.primary} />
          ) : weather ? (
            <View style={styles.weatherContainer}>
              <Text style={styles.weatherIcon}>
                {getWeatherIcon(weather.weathercode)}
              </Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherTemp}>
                  {Math.round(weather.temperature)}°C
                </Text>
                <Text style={styles.weatherLocation}>Bordeaux, FR</Text>
                <Text style={styles.weatherWind}>
                  Vent : {Math.round(weather.windspeed)} km/h
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>
              Impossible de charger la météo
            </Text>
          )}
        </View>
      </View>

      {/* Section Déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>🔴 Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <View style={styles.footer}>
        <Text style={styles.version}>W.I.M.C v1.0.0</Text>
        <Text style={styles.copyright}>© 2026 Thomas Decourt</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.light.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 60,
    marginRight: 20,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherLocation: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  weatherWind: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  errorText: {
    color: '#999',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
  },
  footer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  version: {
    fontSize: 14,
    color: '#999',
  },
  copyright: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
});
