import instance from './axios';

/**
 * Get current user profile (requires authentication)
 * @returns {Promise<{id: number, username: string}>}
 */
export const getProfile = async () => {
  const response = await instance.get('/api/profile/');
  return response.data;
};

/**
 * Update current user profile (requires authentication)
 * @param {Object} data - Profile data
 * @param {string} data.username - New username (3-150 characters)
 * @returns {Promise<{id: number, username: string}>}
 */
export const updateProfile = async (data) => {
  const response = await instance.put('/api/profile/', {
    username: data.username,
  });
  return response.data;
};
