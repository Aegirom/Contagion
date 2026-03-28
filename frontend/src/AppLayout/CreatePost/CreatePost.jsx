import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.backendURL || "http://localhost:3000";
console.log(BACKEND_URL);
const CreatePost = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    author_id: 1,           // Hardcoded for now, usually from Auth context
    artifact_id: 'sample-1', // Mock ID for the file/artifact
    title: '',              // Mapped from "Malware Family"
    content: '',            // Mapped from "Analysis Summary"
    status: 'PENDING',      // Default status
    version: '1.0',         // Default version
    template_type: 'MALWARE_ANALYSIS'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/submissions/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Success:', data.message);
        navigate('/feed');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold" style={{ color: '#F1F5F9' }}>
            New <span style={{ color: '#22C55E' }}>Analysis Report</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl p-8 border space-y-6" style={{ background: 'rgba(12,13,20,0.8)', border: '1px solid rgba(30,34,51,0.8)' }}>

            {/* Title Field (Maps to title in DB) */}
            <div className="space-y-2">
              <label className="font-code text-[10px] uppercase tracking-widest block" style={{ color: '#475569' }}>
                Report Title (Malware Family)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. LockBit 3.0 Analysis"
                className="w-full px-4 py-3 rounded-lg bg-[#0A0B10] border border-white/5 text-sm focus:outline-none focus:border-[#22C55E]/40"
                style={{ color: '#F1F5F9' }}
                required
              />
            </div>

            {/* Analysis Summary (Maps to content in DB) */}
            <div className="space-y-2">
              <label className="font-code text-[10px] uppercase tracking-widest block" style={{ color: '#475569' }}>
                Analysis Summary (Content)
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Describe your findings..."
                rows="6"
                className="w-full px-4 py-3 rounded-lg bg-[#0A0B10] border border-white/5 text-sm focus:outline-none focus:border-[#22C55E]/40 resize-none"
                style={{ color: '#F1F5F9' }}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-lg font-display text-sm font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-50"
              style={{ background: '#22C55E', color: '#0A0B10' }}
            >
              {isSubmitting ? 'UPLOADING...' : 'PUBLISH ANALYSIS'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreatePost;
