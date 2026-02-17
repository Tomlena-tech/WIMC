import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Child } from '@/services/api';
import { Image } from 'react-native';

const childAvatars: { [key: string]: any } = {
  'Léna': require('@/assets/images/Gabby.png'),
  'Greg': require('@/assets/images/greg.png'),
  'default': require('@/assets/images/Gabby.png')
};

interface ChildCardProps {
  child: Child;
  currentLocation?: string;
  lastUpdate?: string;
  onPress?: () => void;
}

export default function ChildCard({ child, currentLocation, lastUpdate, onPress }: ChildCardProps) {
  // Calculer "Il y a X min" depuis created_at
  const getTimeAgo = () => {
  if (!lastUpdate) return 'Inconnue';
  
  const now = new Date();
  const updated = new Date(lastUpdate);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins === 1) return 'Il y a 1 min';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return 'Il y a 1h';
  return `Il y a ${diffHours}h`;
};
  // Statut basé sur dernière mise à jour
  const getStatus = () => {
    if (!lastUpdate) return { 
    text: 'Hors ligne', 
    color: '#ef4444',
    icon: '❌'
    };

    const now = new Date();
    const updated = new Date(lastUpdate);
    const diffMins = Math.floor((now.getTime() - updated.getTime()) / 60000);
    
    if (diffMins < 65) {
       return { text: 'Localisée', color: Colors.light.success, icon: '✓' };
    }
    if (diffMins < 90) {
      return { text: 'Attention', color: Colors.light.warning || '#f59e0b', icon: '⚠' };
    }
    return { text: 'Hors ligne', color: '#ef4444', icon: '❌' };
  };

  const status = getStatus();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header avec emoji et nom */}
      <View style={styles.header}>
        <Image 
          source={childAvatars[child.name] || childAvatars['default']} 
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{child.name}</Text>
          <Text style={styles.age}>
            {child.birth_date ? `${new Date().getFullYear() - new Date(child.birth_date).getFullYear()} ans` : ''}
          </Text>
        </View>
        <View style={styles.checkIcon}>
          <Text style={{ fontSize: 20, color: status.color }}>
            {status.icon}
          </Text>
        </View>
      </View>

      {/* Badge statut */}
      <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.text}
        </Text>
      </View>

      {/* Localisation */}
      <View style={styles.infoRow}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.infoText}>{currentLocation || 'Position inconnue'}</Text>
      </View>

      {/* Dernière mise à jour */}
      <View style={styles.infoRow}>
        <Text style={styles.icon}>🕐</Text>
        <Text style={styles.infoText}>{getTimeAgo()}</Text>
      </View>

      {/* Batterie */}
      <View style={styles.batteryRow}>
        <View style={styles.batteryContainer}>
          <View style={[
  styles.batteryBar, 
  { 
    width: `${child.battery}%`,
    backgroundColor: child.battery > 50 ? Colors.light.success : 
                     child.battery > 20 ? '#f59e0b' : 
                     '#ef4444'
  }
]} />
        </View>
        <Text style={styles.batteryText}>{child.battery}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  age: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  batteryContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  batteryBar: {
    height: '100%',
    borderRadius: 4,
  },
  batteryText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
});
