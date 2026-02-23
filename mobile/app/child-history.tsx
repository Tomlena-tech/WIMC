import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getAccessToken } from '@/services/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface GPSPoint {
  id: number;
  latitude: number;
  longitude: number;
  battery: number;
  timestamp: string;
}

export default function ChildHistory() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [history, setHistory] = useState<GPSPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/api/gps/children/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Erreur historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historique - {name}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📍 Position {history.length - index}</Text>
              <Text style={styles.cardText}>🕐 {formatDate(item.timestamp)}</Text>
              <Text style={styles.cardText}>📡 {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</Text>
              <Text style={styles.cardText}>🔋 {item.battery}%</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucun historique disponible</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#16213e' },
  back: { color: '#4285F4', fontSize: 16, marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  card: { backgroundColor: '#16213e', margin: 10, padding: 15, borderRadius: 10 },
  cardTitle: { color: '#4285F4', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cardText: { color: '#aaa', fontSize: 14, marginTop: 3 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 50, fontSize: 16 },
});
