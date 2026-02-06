import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';  // TODO: Replace with your local IP for testing

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Child {
  id: number;
  name: string;
  birth_date: string | null;
  phone: string | null;
  notes: string | null;
  battery: number;
  parent_id: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  child_id: number;
  created_at: string;
}

// Auth
export const login = async (email: string, password: string) => {
  const response = await api.post(`/auth/login?email=${email}&password=${password}`);
  return response.data;
};

// Children
export const getChildren = async (token: string): Promise<Child[]> => {
  const response = await api.get('/children/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getChild = async (childId: number, token: string): Promise<Child> => {
  const response = await api.get(`/children/${childId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Locations
export const getPlaces = async (token: string): Promise<Location[]> => {
  const response = await api.get('/places/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api;
