import API from './api';

// Get current user's profile
export const getUserProfile = async () => {
  try {
    const response = await API.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Get complete user profile with user data
export const getFullUserProfile = async () => {
  try {
    const response = await API.get('/auth/profile/full');
    return response.data;
  } catch (error) {
    console.error('Get full user profile error:', error);
    throw error;
  }
};

// Update current user's profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await API.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// Update complete user profile (with specializations)
export const updateFullUserProfile = async (profileData) => {
  console.log('=== updateFullUserProfile called ===');
  console.log('profileData:', JSON.stringify(profileData, null, 2));
  try {
    const response = await API.put('/auth/profile/full', profileData);
    console.log('updateFullUserProfile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update full user profile error:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Upload avatar image
export const uploadAvatar = async (avatarData) => {
  console.log('=== uploadAvatar called ===');
  console.log('avatarData keys:', Object.keys(avatarData));
  try {
    const response = await API.post('/auth/profile/avatar', avatarData);
    console.log('uploadAvatar response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload avatar error:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Get current user's data
export const getCurrentUser = async () => {
  try {
    const response = await API.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};
