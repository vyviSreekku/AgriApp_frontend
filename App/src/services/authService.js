import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@planthub_auth';

export default {
  /**
   * Save user auth data to AsyncStorage
   * @param {Object} userData - { name, phone }
   */
  async setUser(userData) {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      console.log('[authService] User logged in:', userData);
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
    } catch (error) {
      console.error('[authService] Error during logout:', error);
    }
  }
};
