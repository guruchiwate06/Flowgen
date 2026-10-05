import { fetchAI } from './aiClient.js';

export const rewriteCaption = async (text, tone) => {
  return await fetchAI('/rewrite', { text, tone });
};
