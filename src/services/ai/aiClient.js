import { auth } from '../../firebase.js';

// Determine API backend URL:
// In production builds (or when hosted on Vercel), point to live Render backend unless explicitly specified
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    // If running on Vercel or custom domain in production, use Render backend directly
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('onrender.com')) {
      return 'https://flowgen-vcul.onrender.com/api/ai';
    }
  }
  if (envUrl && !envUrl.includes('localhost')) {
    return `${envUrl}/api/ai`;
  }
  // Local development fallback
  return envUrl ? `${envUrl}/api/ai` : 'http://localhost:3001/api/ai';
};

const BASE_URL = getApiBaseUrl();

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
