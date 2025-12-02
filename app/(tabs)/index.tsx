// Import React et le hook useState
import React, { useState } from 'react';

// Import les composants React Native
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Définir les couleurs
const Colors = {
  primary: '#2563EB',    // Bleu
  secondary: '#A2E3A2',  // Pistache
  dark: '#1F2937',       // Gris foncé
  light: '#F3F4F6',      // Gris clair
  white: '#FFFFFF',      // Blanc
};

// Composant principal
export default function HomeScreen() {
  // États (données qui changent)
  const [email, setEmail] = useState('');           // Email vide au départ
  const [password, setPassword] = useState('');     // Password vide au départ
  const [isLoading, setIsLoading] = useState(false); // Pas en train de charger

  // Fonction quand on clique "Login"
  const handleLogin = () => {
    // Vérifier que email et password sont remplis
    if (!email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs!');
      return;
    }

    // Commencer le chargement
    setIsLoading(true);

    // Simulation : après 2 secondes, c'est fini
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Succès', 'Tu es connecté!');
    }, 2000);
  };

  // Le design de l'écran
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER : Logo et titre */}
      <View style={styles.header}>
        <Text style={styles.logo}>🗺️</Text>
        <Text style={styles.title}>WIMC</Text>
        <Text style={styles.subtitle}>Where Is My Child</Text>
      </View>

      {/* FORMULAIRE : Email, Password, Bouton */}
      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="exemple@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
        </View>

        {/* Bouton Login */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Connexion...' : '✅ Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FOOTER : Lien inscription */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas de compte? </Text>
        <TouchableOpacity>
          <Text style={styles.signupLink}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Les STYLES (design)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark,
    marginTop: 5,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: Colors.dark,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
