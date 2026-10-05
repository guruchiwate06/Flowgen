import { fetchAI } from './aiClient.js';

export const generateCaptions = async (payload) => {
  return await fetchAI('/caption', payload);
};
