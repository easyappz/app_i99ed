import instance from './axios';

/**
 * Setup authentication interceptor to add token to requests
 * @param {function} getToken - Function that returns the current auth token
 */
export const setupAuthInterceptor = (getToken) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export default setupAuthInterceptor;
