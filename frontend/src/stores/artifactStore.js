import { create } from 'zustand';
import { uploadArtifact } from '../services/api';

const initialState = {
  selectedFile: null,
  uploadedArtifact: null,
  uploadProgress: 0,
  uploadStatus: 'idle',
  error: '',
};

export const useArtifactStore = create((set, get) => ({
  ...initialState,

  selectFile: (file) => set({
    selectedFile: file,
    uploadedArtifact: null,
    uploadProgress: 0,
    uploadStatus: file ? 'selected' : 'idle',
    error: '',
  }),

  clearUpload: () => set(initialState),

  uploadSelectedArtifact: async ({ malwareFamily, malwareCategory }) => {
    const file = get().selectedFile;
    if (!file) {
      throw new Error('Select an artifact file before uploading');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('malware_family', malwareFamily || '');
    formData.append('malware_category', malwareCategory || 'Other');

    set({ uploadStatus: 'uploading', uploadProgress: 0, error: '' });

    try {
      const response = await uploadArtifact(formData, (event) => {
        if (!event.total) return;
        set({ uploadProgress: Math.round((event.loaded * 100) / event.total) });
      });

      set({
        uploadedArtifact: response.data.artifact,
        uploadProgress: 100,
        uploadStatus: response.data.duplicate ? 'duplicate' : 'uploaded',
      });

      return response.data.artifact;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Artifact upload failed';
      set({ error: message, uploadStatus: 'failed' });
      throw new Error(message);
    }
  },
}));
