import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@planthub_auth';

const listeners = new Set();

function notify(user) {
  listeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.warn('[authService] Listener error:', e);
    }
  });
}

export default {
  /**
   * Subscribe to auth changes.
   * @param {(user: any|null) => void} listener
   * @returns {() => void} unsubscribe
   */
  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Save user auth data to AsyncStorage
   * @param {Object} userData - { name, phone }
   */
  async setUser(userData) {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      console.log('[authService] User logged in:', userData);
      notify(userData);
    } catch (error) {
      console.error('[authService] Error saving user:', error);
    }
  },

  /**
   * Get current logged-in user
   * @returns {Promise<Object|null>} User data or null
   */
  async getUser() {
    try {
      const data = await AsyncStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[authService] Error reading user:', error);
      return null;
    }
  },

  /**
   * Check if user is logged in
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    const user = await this.getUser();
    return !!user;
  },

  /**
   * Logout and clear user data
   */
  async logout() {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      console.log('[authService] User logged out');
      notify(null);
    } catch (error) {
      console.error('[authService] Error during logout:', error);
    }
  }
};
