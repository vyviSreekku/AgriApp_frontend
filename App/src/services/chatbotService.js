import { getApiUrl } from '../utils/config';

const getChatbotApiBase = async () => {
  const baseUrl = await getApiUrl();
  return `${baseUrl}/chatbot`;
};

export const askChatbot = async (question) => {
  const chatbotApi = await getChatbotApiBase();
  const response = await fetch(`${chatbotApi}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || 'Failed to get chatbot response');
  }

  return data;
};

export const checkChatbotHealth = async () => {
  const chatbotApi = await getChatbotApiBase();
  const response = await fetch(`${chatbotApi}/health`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || 'Chatbot service is unavailable');
  }

  return data;
};
