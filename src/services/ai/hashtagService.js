import { fetchAI } from './aiClient.js';

export const generateHashtags = async (context) => {
  return await fetchAI('/hashtags', { context });
};
