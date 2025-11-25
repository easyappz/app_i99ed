import instance from './axios';

/**
 * Get message history (requires authentication)
 * @param {Object} params - Query parameters
 * @param {number} [params.limit=50] - Maximum number of messages to return
 * @param {number} [params.offset=0] - Number of messages to skip
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getMessages = async (params = {}) => {
  const response = await instance.get('/api/messages/', {
    params: {
      limit: params.limit || 50,
      offset: params.offset || 0,
    },
  });
  return response.data;
};

/**
 * Send a message (requires authentication)
 * @param {Object} data - Message data
 * @param {string} data.content - Message content (1-5000 characters)
 * @returns {Promise<{id: number, content: string, author: {id: number, username: string}, created_at: string}>}
 */
export const sendMessage = async (data) => {
  const response = await instance.post('/api/messages/', {
    content: data.content,
  });
  return response.data;
};
