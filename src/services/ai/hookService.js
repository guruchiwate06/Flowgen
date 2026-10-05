import { fetchAI } from './aiClient.js';

export const generateHooks = async (context) => {
  return await fetchAI('/hooks', { context });
};
