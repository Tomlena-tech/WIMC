import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createChild } from '@/services/api';
import { Colors } from '@/constants/Colors';

export default function AddChildScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Prénom requis'); return; }
    try {
      setLoading(true);
      await createChild(name.trim());
      router.back();
    } catch (e: any) {
      setError(e.message || 'Erreur création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouvel enfant</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>👶 Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Emma, Lucas..."
          value={name}
          onChangeText={setName}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>✅ Créer le suivi GPS</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1F4E79', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  back: { color: '#fff', opacity: 0.8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  form: { padding: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#2C3E50' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EC', marginBottom: 16 },
  error: { color: 'red', marginBottom: 12 },
  button: { backgroundColor: '#1F4E79', padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
