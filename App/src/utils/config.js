/**
 * Configuration & runtime backend URL management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for persisting custom backend URL
const STORAGE_KEY = 'agri_app:api_url';

// Fallback URL used when nothing has been configured yet
// Default pointed to the deployed Azure backend provided by the user
const DEFAULT_API_URL = 'https://agri-fastapi-backend-f2hwbvhwa8bugvcu.centralindia-01.azurewebsites.net';

// In-memory value that services will read through getApiUrl()
let currentApiUrl = DEFAULT_API_URL;
let initialized = false;

/**
 * Get the current backend base URL.
 * Loads the last saved value from AsyncStorage on first use.
 */
export const getApiUrl = async () => {
	if (!initialized) {
		try {
			const stored = await AsyncStorage.getItem(STORAGE_KEY);
			if (stored) {
				currentApiUrl = stored;
			}
		} catch (error) {
			console.warn('Failed to load stored API URL, using default:', error);
		}
		initialized = true;
	}

	return currentApiUrl;
};

/**
 * Update the backend base URL at runtime and persist it.
 */
export const setApiUrl = async (url) => {
	const normalized = String(url || '').trim();
	if (!normalized) {
		return;
	}

	currentApiUrl = normalized;
	initialized = true;

	try {
		await AsyncStorage.setItem(STORAGE_KEY, normalized);
	} catch (error) {
		console.warn('Failed to persist API URL:', error);
	}
};

/**
 * Backwards-compatible constant used by older code paths.
 * NOTE: New code should prefer getApiUrl()/setApiUrl() so that
 * the URL can be changed at runtime from the Settings UI.
 */
export const API_URL = DEFAULT_API_URL;
