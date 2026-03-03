import axios from 'axios';
import { getAccessToken, refreshAccessToken, storeTokens } from './auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// ✅ Interceptor : Ajouter token automatiquement
axios.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor : Refresh automatique si 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ NE PAS refresh sur la route /login
    if (originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('🔄 Token expired, refreshing...');
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface Child {
  id: number;
  name: string;
  birth_date: string;
  phone: string;
  notes: string;
  battery: number;
  parent_id: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  child_id: number;
  created_at: string;
}

// ✅ Login avec stockage automatique
export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });
  
  const { access_token, refresh_token } = response.data;
  await storeTokens(access_token, refresh_token);
  
  return response.data;
};

// ✅ API calls (plus besoin de passer TOKEN)
export const getChildren = async (): Promise<Child[]> => {
  const response = await axios.get(`${API_BASE_URL}/children/`);
  return response.data;
};

export const getChild = async (childId: number): Promise<Child> => {
  const response = await axios.get(`${API_BASE_URL}/children/${childId}`);
  return response.data;
};

export const getPlaces = async (): Promise<Location[]> => {
  const response = await axios.get(`${API_BASE_URL}/places/`);
  return response.data;
};

export const getPlace = async (locationId: number): Promise<Location> => {
  const response = await axios.get(`${API_BASE_URL}/places/${locationId}`);
  return response.data;
};
// 🆕 GPS Temps Réel
export const getChildGPSPosition = async (childId: number) => {
  const response = await axios.get(`${API_BASE_URL}/api/gps/children/${childId}/last-position?t=${Date.now()}`);
  return response.data;
};
export const createChild = async (name : string) => {
  const response = await axios.post(`${API_BASE_URL}/children/`, { name });
  return response.data;
};

export const getAllChildrenGPSPositions = async () => {
  const children = await getChildren();
  const positions = await Promise.all(
    children.map(child => 
      getChildGPSPosition(child.id).catch(() => null)
    )
  );
  return positions.filter(p => p !== null);
};
