import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import ChildCard from '@/components/ChildCard';
import { getChildren, Child, getAllChildrenGPSPositions } from '@/services/api';
import { useRouter } from 'expo-router';

type GPSPosition = {
  child_id: number;
  latitude: number;
  longitude: number;
  last_update: string;
  battery?: number;
};

export default function ListScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gpsPositions, setGpsPositions] = useState<GPSPosition[]>([]);
  const [gpsHistory, setGpsHistory] = useState<GPSPosition[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadGPSData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const { isAuthenticated } = await import('@/services/auth');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        setLoading(false);
        return;
      }

      const childrenData = await getChildren();
      const gpsData = await getAllChildrenGPSPositions();
      
      setChildren(childrenData);
      setGpsPositions(gpsData);

      setGpsHistory(prev => {
        const newPositions = gpsData.filter(
          newPos => !prev.some(
            oldPos => 
              oldPos.child_id === newPos.child_id && 
              oldPos.last_update === newPos.timestamp
          )
        );
        return [...newPositions, ...prev].slice(0, 100);
      });

    } catch (err: any) {
      console.error('Erreur chargement données:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadGPSData = async () => {
    try {
      const { isAuthenticated } = await import('@/services/auth');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) return;

      const gpsData = await getAllChildrenGPSPositions();
      setGpsPositions(gpsData);

      setGpsHistory(prev => {
        const newPositions = gpsData.filter(
          newPos => !prev.some(
            oldPos => 
              oldPos.child_id === newPos.child_id && 
              oldPos.timestamp === newPos.timestamp
          )
        );
        return [...newPositions, ...prev].slice(0, 100);
      });

    } catch (err: any) {
      console.error('Erreur refresh GPS:', err);
    }
  };

  const getCurrentGPSPosition = (childId: number) => {
    return gpsPositions.find(gps => gps.child_id === childId);
  };

  const countStatuses = () => {
    let safe = 0;
    let warning = 0;
    let unknown = 0;
    
    children.forEach(child => {
      const gps = getCurrentGPSPosition(child.id);
      
      if (!gps || !gps.last_update) {
        unknown++;
        return;
      }
      
      const diffMins = Math.floor(
        (new Date().getTime() - new Date(gps.last_update).getTime()) / 60000
      );
      
      if (diffMins < 5) safe++;
      else if (diffMins < 15) warning++;
      else unknown++;
    });
    
    return { safe, warning, unknown, total: children.length }; // c'est ce code qui genere si 1 ou 2 enfants sont ou est en sécurité
  };

  const stats = countStatuses();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WIMC</Text>
          <View style={styles.statusDot} />
          <Text style={styles.headerSubtitle}>En ligne</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WIMC</Text>
          <View style={styles.statusDot} />
          <Text style={styles.headerSubtitle}>En ligne</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WIMC</Text>
        <View style={styles.statusDot} />
        <Text style={styles.headerSubtitle}>En ligne</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes enfants</Text>
          <Text style={styles.sectionSubtitle}>
            {children.length} enfant{children.length > 1 ? 's' : ''} suivi{children.length > 1 ? 's' : ''}
          </Text>
        </View>

        {children.map(child => {
          const gps = getCurrentGPSPosition(child.id);
          return (
            <ChildCard
              key={child.id}
              child={child}
              currentLocation={gps && gps.latitude !== null && gps.longitude !== null 
                ? `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}` 
                : 'GPS indisponible'}              
              lastUpdate={gps?.last_update}
              onPress={() => router.push(`/child-history?id=${child.id}&name=${child.name}`)}
            />
          );
        })}

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-child')}>
          <Image 
            source={require('@/assets/images/pandypat.png')}
            style={styles.addButtonImage}
          />
          <Text style={styles.addButtonText}>Ajouter un enfant</Text>
          <Text style={styles.addButtonSub}>Nouveau suivi GPS</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  historyIndicator: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: Colors.light.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: 16,
    marginVertical: 26,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  addButtonIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  addButtonImage: {
    width: 50,
    height: 50,
    marginBottom: 12,
  },
  addButtonText: {
    color: Colors.light.white,
    fontSize: 18,
    fontWeight: '700',
  },
  addButtonSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.warning,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
