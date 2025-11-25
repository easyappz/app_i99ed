import instance from './axios';

/**
 * Register a new user
 * @param {Object} data - Registration data
 * @param {string} data.username - Username (3-150 characters)
 * @param {string} data.password - Password (min 6 characters)
 * @returns {Promise<{id: number, username: string, token: string}>}
 */
export const register = async (data) => {
  const response = await instance.post('/api/auth/register/', {
    username: data.username,
    password: data.password,
  });
  return response.data;
};

/**
 * Login user
 * @param {Object} data - Login data
 * @param {string} data.username - Username
 * @param {string} data.password - Password
 * @returns {Promise<{id: number, username: string, token: string}>}
 */
export const login = async (data) => {
  const response = await instance.post('/api/auth/login/', {
    username: data.username,
    password: data.password,
  });
  return response.data;
};

/**
 * Logout user (requires authentication)
 * @returns {Promise<{detail: string}>}
 */
export const logout = async () => {
  const response = await instance.post('/api/auth/logout/');
  return response.data;
};
