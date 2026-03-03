import { API_URL } from '../utils/config';

const CHATBOT_API = `${API_URL}/chatbot`;

export const askChatbot = async (question) => {
  const response = await fetch(`${CHATBOT_API}/query`, {
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
  const response = await fetch(`${CHATBOT_API}/health`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || 'Chatbot service is unavailable');
  }

  return data;
};
