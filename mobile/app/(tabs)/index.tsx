import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import ChildCard from '@/components/ChildCard';
import { getChildren, Child, getAllChildrenGPSPositions } from '@/services/api';

type GPSPosition = {
  child_id: number;
  latitude: number;
  longitude: number;
  last_update: string;
  battery?: number;
};

type SafeZoneStatus = {
  child_id: number;
  in_safe_zone: boolean;

};  

export default function ListScreen() { //useState = stocke une donnée dans 1 composant et = Re-render
  const [children, setChildren] = useState<Child[]>([]); // on s'assure que le tableau enfant contient uniquement le objets enfant
  const [loading, setLoading] = useState(true); //spinner afin d'eviter de montrer qqch de prématuré
  const [error, setError] = useState(''); //gestion des erreurs eventuelles
  const [gpsPositions, setGpsPositions] = useState<GPSPosition[]>([]); //gps contient les pos et set les mets a jours et  tout ça dans 1 tableau d'objet qui est vide au depart
  const [gpsHistory, setGpsHistory] = useState<GPSPosition[]>([]); // 📍 Historique local
  const [safeZones, setSafeZones] = useState<SafeZoneStatus[]>([]); // pour les zones safes dans les cards


  // 🔄 Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  // 🔄 Polling automatique toutes les 10 secondes = update la position gps toutes les 10sec (timer)
  useEffect(() => {
    const interval = setInterval(() => {
      loadGPSData(); // Recharge uniquement les GPS
      loadSafeZones(); // les zones safes en "temps reel" (use state stock trnsforme et declenche le changement)

    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 📡 Chargement complet (enfants + GPS)
  const loadData = async () => {
    try {
      setLoading(true); //spinner
      setError(''); //remts les erreurs a 0

      // ✅ Vérifier authentification
      const { isAuthenticated } = await import('@/services/auth'); // "prends la fonction isAuth qui se trouve dans await import
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        setLoading(false);
        return;
      }

      // Charger enfants + GPS
      const childrenData = await getChildren();
      const gpsData = await getAllChildrenGPSPositions();
      
      setChildren(childrenData);
      setGpsPositions(gpsData);
      setTimeout(() => loadSafeZones(), 500);


      // 📍 Ajouter au début de l'historique (éviter doublons)
      setGpsHistory(prev => {
        const newPositions = gpsData.filter(
          newPos => !prev.some(
            oldPos => 
              oldPos.child_id === newPos.child_id && 
              oldPos.last_update === newPos.timestamp
          )
        );
        return [...newPositions, ...prev].slice(0, 100); // Garde 100 dernières
      });

    } catch (err: any) {
      console.error('Erreur chargement données:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // 📡 Recharger uniquement GPS (pour polling)
  const loadGPSData = async () => {
    try {
      const { isAuthenticated } = await import('@/services/auth');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) return;

      const gpsData = await getAllChildrenGPSPositions();
      setGpsPositions(gpsData);

      // 📍 Ajouter au début de l'historique
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

  // 🏠 Charger statuts safe zones dans les cards
const loadSafeZones = async () => {
  try {
    const { isAuthenticated } = await import('@/services/auth');
    const authenticated = await isAuthenticated();
    
    if (!authenticated) return;

    // Charger le statut pour chaque enfant
    const safeZonePromises = children.map(async (child) => {
      try {
        const { getToken } = await import('@/services/auth');
        const token = await getToken();
        
        const response = await fetch(
          `http://10.5.1.110:8000/api/gps/children/${child.id}/in-safe-zone`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            child_id: child.id,
            in_safe_zone: data.in_safe_zone
          };
        }
      } catch (err) {
        console.error(`Erreur safe zone enfant ${child.id}:`, err);
      }
      
      return { child_id: child.id, in_safe_zone: false };
    });

    const safeZoneResults = await Promise.all(safeZonePromises);
    setSafeZones(safeZoneResults);

  } catch (err: any) {
    console.error('Erreur refresh safe zones:', err);
  }
};

  // 📍 Trouver la position GPS la plus récente pour un enfant
  const getCurrentGPSPosition = (childId: number) => { //fct qui prend le N° d el'enfant en param 
    return gpsPositions.find(gps => gps.child_id === childId); //qui return qqch ds le tableau gpsPositions compare les id
  };
  // 🏠 Trouver le statut safe zone pour un enfant
  const getSafeZoneStatus = (childId: number) => {
    return safeZones.find(sz => sz.child_id === childId);
};
  // Compter statuts basés sur GPS
  const countStatuses = () => {
    let safe = 0;
    let warning = 0;
    let unknown = 0;
    
    children.forEach(child => { //ds le tab chidren pour chqs elements
    //  regarde gps et decide si il est safe ..
      const gps = getCurrentGPSPosition(child.id);
      
      if (!gps || !gps.last_update) {
        unknown++;
        return;
      }
      
      // Calcule du temps ecoulé de la position gps (utile de le mettre sur la card??)
      const diffMins = Math.floor(
        (new Date().getTime() - new Date(gps.last_update).getTime()) / 60000
      );
      
      if (diffMins < 5) safe++;
      else if (diffMins < 15) warning++;
      else unknown++;
    });
    
    return { safe, warning, unknown, total: children.length };
  };

  const stats = countStatuses();

  // 🔄 Loading / le HEADER Bleu 
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

  // ❌ Erreur
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
          {/* 📍 Indicateur historique */} 
          <Text style={styles.historyIndicator}>
            📍 {gpsHistory.length} positions en historique
          </Text>
        </View>

        {/* Liste enfants */}
        {children.map(child => {
          const gps = getCurrentGPSPosition(child.id);
          const safeZone = getSafeZoneStatus(child.id);
          return (
            <ChildCard
              key={child.id}
              child={child}
              currentLocation={gps && gps.latitude !== null && gps.longitude !== null 
                ? `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}` 
                : 'GPS indisponible'}              
                lastUpdate={gps?.last_update}
                inSafeZone={safeZone?.in_safe_zone} 
            />
          );
        })}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.safe}</Text>
            <Text style={[styles.statLabel, { color: Colors.light.success }]}>Récent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.warning}</Text>
            <Text style={[styles.statLabel, { color: Colors.light.warning }]}>Ancien</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.unknown}</Text>
            <Text style={[styles.statLabel, { color: Colors.light.textSecondary }]}>Inconnu</Text>
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
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,
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
