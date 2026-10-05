export const captionPrompt = ({ title, niche, contentDescription, tone, platform }) => {
  return `Generate 3 highly engaging, catchy social media captions AND 3 scroll-stopping video hooks based on the following details.\n\nProject Title: ${title}\nNiche/Category: ${niche}\nContent Description: ${contentDescription}\nTone: ${tone}\nPlatform: ${platform}\n\nRespond ONLY with a valid JSON object in the following format:\n{\n  "hooks": ["hook 1", "hook 2", "hook 3"],\n  "captions": ["caption 1", "caption 2", "caption 3"],\n  "hashtags": ["#tag1", "#tag2", "#tag3"]\n}\nDo not include any markdown formatting or extra text outside the JSON.`;
};

export const hashtagPrompt = (context) => {
  return `Generate a space-separated list of 10 to 15 highly relevant and trending hashtags for the following topic.\nDo not include commas, just the # symbol before each tag.\nTopic: ${context}`;
};

export const rewritePrompt = (text, tone = 'professional') => {
  return `Rewrite the following text to sound more ${tone}. Make it engaging and clear.\nText: ${text}`;
};

export const hookPrompt = (context) => {
  return `Generate 3 catchy and engaging hooks (first sentences or ideas) for a short-form video based on the following topic.\nReturn them as a numbered list.\nTopic: ${context}`;
};
