import { API_URL, getApiUrl } from './utils/config';

export async function backendLoginWithFirebase(idToken, profile = {}) {
  const base = (typeof getApiUrl === 'function') ? (await getApiUrl()) : API_URL;
  const url = `${(base || API_URL).replace(/\/$/, '')}/users/firebase/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: Object.keys(profile).length ? JSON.stringify(profile) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(`Invalid JSON response from backend: ${text}`);
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Backend error ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}
