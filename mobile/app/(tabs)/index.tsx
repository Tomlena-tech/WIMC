import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import ChildCard from '@/components/ChildCard';
import { getChildren, getPlaces, Child, Location } from '@/services/api';

export default function ListScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [childrenData, locationsData] = await Promise.all([
        getChildren(),
        getPlaces(),
      ]);
      
      setChildren(childrenData);
      setLocations(locationsData);
    } catch (err: any) {
      console.error('Erreur chargement données:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Trouver la location la plus récente pour un enfant
  const getCurrentLocation = (childId: number) => {
    const childLocations = locations.filter(loc => loc.child_id === childId);
    if (childLocations.length === 0) return undefined;
    
    // Trier par date (plus récent en premier)
    childLocations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return childLocations[0];
  };

  // Compter statuts
  const countStatuses = () => {
    let safe = 0;
    let warning = 0;
    
    children.forEach(child => {
      const location = getCurrentLocation(child.id);
      if (!location) return;
      
      const diffMins = Math.floor(
        (new Date().getTime() - new Date(location.created_at).getTime()) / 60000
      );
      
      if (diffMins < 5) safe++;
      else warning++;
    });
    
    return { safe, warning, total: children.length };
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
      {/* Header bleu */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WIMC</Text>
        <View style={styles.statusDot} />
        <Text style={styles.headerSubtitle}>En ligne</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Titre section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes enfants</Text>
          <Text style={styles.sectionSubtitle}>
            {children.length} enfant{children.length > 1 ? 's' : ''} suivi{children.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Liste enfants */}
        {children.map(child => {
          const location = getCurrentLocation(child.id);
          return (
            <ChildCard
              key={child.id}
              child={child}
              currentLocation={location?.name}
              lastUpdate={location?.created_at}
            />
          );
        })}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.safe}</Text>
            <Text style={[styles.statLabel, { color: Colors.light.success }]}>En sécurité</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.warning}</Text>
            <Text style={[styles.statLabel, { color: Colors.light.warning }]}>Attention</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Bouton ajouter enfant (disabled pour MVP) */}
        <TouchableOpacity style={styles.addButton} disabled>
          <Text style={styles.addButtonText}>+ Ajouter un enfant</Text>
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
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,  // Disabled pour MVP
  },
  addButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
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
