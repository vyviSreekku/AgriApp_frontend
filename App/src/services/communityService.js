import axios from 'axios';
import { API_URL } from '../utils/config';

const COMMUNITY_API = `${API_URL}/community`;

/**
 * Community Service
 * Handles all API calls for community posts and comments
 */

// ==================== Posts ====================

/**
 * Get all community posts
 * @param {number} skip - Number of posts to skip (for pagination)
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise<Array>} List of posts
 */
export const getAllPosts = async (skip = 0, limit = 20) => {
  try {
    const response = await axios.get(`${COMMUNITY_API}/posts`, {
      params: { offset: skip, limit }
    });
    console.log('[DEBUG] Fetched', response.data.length, 'posts');
    if (response.data.length > 0) {
      console.log('[DEBUG] First post has', response.data[0].images?.length || 0, 'images');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get a single post by ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Post details with comments
 */
export const getPostById = async (postId) => {
  try {
    const response = await axios.get(`${COMMUNITY_API}/posts/${postId}`);
    console.log('[DEBUG] Fetched post:', response.data.id, response.data.title);
    console.log('[DEBUG] Post has', response.data.images?.length || 0, 'images');
    if (response.data.images) {
      response.data.images.forEach((img, idx) => {
        console.log(`[DEBUG] Image ${idx}:`, img.image_url);
      });
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Search posts by keyword
 * @param {string} keyword - Search term
 * @param {number} skip - Number of posts to skip
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise<Array>} List of matching posts
 */
export const searchPosts = async (keyword, skip = 0, limit = 20) => {
  try {
    const response = await axios.get(`${COMMUNITY_API}/posts`, {
      params: { q: keyword, offset: skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching posts:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @param {number} postData.user_id - User ID (temporary, will use auth later)
 * @param {string} postData.title - Post title/question
 * @param {string} postData.content - Post content/description
 * @returns {Promise<Object>} Created post
 */
export const createPost = async (postData, imageUris = []) => {
  try {
    console.log('Creating post with data:', postData);
    console.log('Image URIs:', imageUris);
    console.log('API endpoint:', `${COMMUNITY_API}/posts`);

    const formData = new FormData();
    formData.append('user_id', String(postData.user_id));
    formData.append('title', postData.title);
    formData.append('content', postData.content);

    if (Array.isArray(imageUris) && imageUris.length > 0) {
      console.log(`Adding ${imageUris.length} images to FormData...`);
      imageUris.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `image_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        // Each file must be appended with the SAME field name 'files' 
        // for FastAPI to receive it as List[UploadFile]
        const file = {
          uri,
          name: filename,
          type: type,
        };
        formData.append('files', file);
        console.log(`  Added file ${idx}: ${filename} (${type})`);
      });
    } else {
      console.log('No images to upload');
    }

    console.log('Sending request...');

    // Use fetch API instead of axios for better React Native FormData support
    const response = await fetch(`${COMMUNITY_API}/posts`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response received:', data);
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    console.error('Error details:', {
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update an existing post
 * @param {number} postId - Post ID
 * @param {Object} updateData - Fields to update
 * @param {string} [updateData.title] - New title
 * @param {string} [updateData.content] - New content
 * @returns {Promise<Object>} Updated post
 */
export const updatePost = async (postId, updateData, requestingUserId = 1, isAdmin = false) => {
  try {
    const response = await axios.patch(
      `${COMMUNITY_API}/posts/${postId}`,
      updateData,
      { params: { requesting_user_id: requestingUserId, is_admin: isAdmin } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a post
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deletePost = async (postId, requestingUserId = 1, isAdmin = false) => {
  try {
    const response = await axios.delete(`${COMMUNITY_API}/posts/${postId}` , {
      params: { requesting_user_id: requestingUserId, is_admin: isAdmin },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error.response?.data || error.message);
    throw error;
  }
};

// ==================== Likes ====================
/**
 * Like or unlike a post
 * @param {number} postId
 * @param {number} delta +1 to like, -1 to unlike
 */
export const likePost = async (postId, delta = 1) => {
  try {
    const response = await axios.post(`${COMMUNITY_API}/posts/${postId}/like`, null, {
      params: { delta }
    });
    return response.data; // { likes_count }
  } catch (error) {
    console.error('Error liking post:', error.response?.data || error.message);
    throw error;
  }
};

// ==================== Comments ====================

/**
 * Get all comments for a post
 * @param {number} postId - Post ID
 * @returns {Promise<Array>} List of comments
 */
export const getCommentsByPost = async (postId) => {
  try {
    const response = await axios.get(`${COMMUNITY_API}/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a new comment on a post
 * @param {Object} commentData - Comment data
 * @param {number} commentData.user_id - User ID (temporary, will use auth later)
 * @param {number} commentData.post_id - Post ID
 * @param {string} commentData.content - Comment content
 * @returns {Promise<Object>} Created comment
 */
export const createComment = async (postId, commentData) => {
  try {
    // Backend expects path param postId and body with { user_id, content }
    const payload = { user_id: commentData.user_id, content: commentData.content };
    const response = await axios.post(`${COMMUNITY_API}/posts/${postId}/comments`, payload);
    return response.data;
  } catch (error) {
    console.error('Error creating comment:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update a comment
 * @param {number} commentId - Comment ID
 * @param {Object} updateData - Fields to update
 * @param {string} updateData.content - New content
 * @returns {Promise<Object>} Updated comment
 */
export const updateComment = async (commentId, updateData) => {
  try {
    const response = await axios.put(`${COMMUNITY_API}/comments/${commentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await axios.delete(`${COMMUNITY_API}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  getAllPosts,
  getPostById,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  likePost,
};
