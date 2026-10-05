import { auth } from '../../firebase.js';

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/ai` : '/api/ai';

export const fetchAI = async (endpoint, payload) => {
  try {
    let token = '';
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`AI Client Error (${endpoint}):`, error);
    throw error;
  }
};
