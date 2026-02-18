import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// ✅ Stocker les tokens de manière sécurisée
export const storeTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    console.log('✅ Tokens stored securely');
  } catch (error) {
    console.error('❌ Error storing tokens:', error);
  }
};

// ✅ Récupérer access token
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('access_token');
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return null;
  }
};

// ✅ Récupérer refresh token
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('refresh_token');
  } catch (error) {
    console.error('❌ Error getting refresh token:', error);
    return null;
  }
};

// ✅ Supprimer tokens (logout)
export const clearTokens = async () => {
  try {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    console.log('✅ Tokens cleared');
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
  }
};

// ✅ Refresh automatique
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();
  
  if (!refreshToken) {
    console.log('⚠️ No refresh token available');
    return null;
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    
    const newAccessToken = response.data.access_token;
    await SecureStore.setItemAsync('access_token', newAccessToken);
    
    console.log('✅ Token refreshed successfully');
    return newAccessToken;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    await clearTokens();
    return null;
  }
};

// ✅ Vérifier si connecté
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return token !== null;
};
