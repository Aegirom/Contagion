import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getFullUserProfile, updateFullUserProfile, uploadAvatar } from '../../services/userService';
import { Link, useNavigate } from 'react-router-dom';
import AvatarCropper from './Components/AvatarCropper';
import PlusButton from '../Dashboard/Components/Buttons.jsx';

const ProfilePage = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    specializations: []
  });

  // Specialization input state
  const [specInput, setSpecInput] = useState('');

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getFullUserProfile();
        if (data.user) {
          updateUser(data.user);
        }
        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name || '',
            bio: data.profile.bio || '',
            avatar_url: data.profile.avatar_url || '',
            specializations: data.profile.specializations || []
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleAddSpecialization = (e) => {
    e.preventDefault();
    if (specInput.trim() && !profile.specializations.includes(specInput.trim())) {
      setProfile(prev => ({
        ...prev,
        specializations: [...prev.specializations, specInput.trim()]
      }));
      setSpecInput('');
    }
  };

  const handleRemoveSpecialization = (specToRemove) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== specToRemove)
    }));
  };

  const handleAvatarSave = async (croppedImageData) => {
    setShowCropper(false);
    setSaving(true);
    setError(null);
    try {
      const response = await uploadAvatar({ croppedImage: croppedImageData });
      const avatarPath = response.path;
      setProfile(prev => ({ ...prev, avatar_url: avatarPath }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.response?.data?.error || 'Failed to upload avatar.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await updateFullUserProfile(profile);
      if (response.user) {
        updateUser(response.user);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const reputationScore = user?.reputation_score ?? 0;
  const expertiseLevel = user?.expertise_level || 'Beginner';

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ background: '#050508' }}>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>
          Loading profile...
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto relative z-10">
      {/* Ambient lighting — passive atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          width: '900px', height: '600px',
          top: '-200px', left: '-300px',
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.055) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          width: '700px', height: '700px',
          bottom: '-250px', right: '-150px',
          background: 'radial-gradient(ellipse, rgba(109,40,217,0.04) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,197,94,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.018) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative px-6 py-12 md:px-12 lg:px-20 max-w-[1440px] mx-auto space-y-6" style={{ zIndex: 1 }}>
        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 pb-6 border-b border-phantom">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <div
              className="w-1 h-6 bg-toxic shadow-[0_0_8px_#22C55E]"
              style={{ background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.8)' }}
            />
            <h1 className="font-display text-3xl font-black text-slate-100 tracking-tighter uppercase">
              Agent Profile
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-colors"
              style={{
                background: 'rgba(10,11,16,0.5)',
                border: '1px solid rgba(30,34,51,0.8)',
                color: '#64748B'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-colors"
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#EF4444'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Profile Card */}
          <div className="xl:col-span-1">
            <div
              className="rounded-xl p-6 border shadow-card sticky top-6"
              style={{
                background: 'rgba(12,13,20,0.6)',
                border: '1px solid rgba(30,34,51,0.8)',
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative group mb-6">
                  <div className="absolute inset-0 bg-toxic/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                  <div className="relative w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-toxic/50 to-blue-500/50 ring-4 ring-[#0c0d10] overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.5) 0%, rgba(59,130,246,0.5) 100%)' }}>
                    <img
                      src={profile.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.username || 'Analyst') + '&background=10b981&color=fff&size=256'}
                      alt="Profile Avatar"
                      className="w-full h-full rounded-full object-cover bg-[#0c0d10]"
                    />
                  </div>
                  <button
                    onClick={() => setShowCropper(true)}
                    className="absolute bottom-1 right-1 w-9 h-9 bg-toxic rounded-xl flex items-center justify-center border-4 border-[#0c0d10] text-[#050508] hover:bg-[#4ade80] hover:scale-110 transition-all shadow-lg z-20"
                    title="Update Biometrics"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                <h2 className="font-display text-xl font-bold text-slate-100 tracking-tight mb-1">{user?.username || 'Unknown Agent'}</h2>
                <p className="font-mono text-[10px] text-slate-500 mb-4">{user?.email}</p>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border"
                    style={{
                      background: 'rgba(30,34,51,0.5)',
                      border: '1px solid rgba(30,34,51,0.8)',
                      color: '#94a3b8'
                    }}
                  >
                    {user?.role || 'Analyst'}
                  </span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border"
                    style={{
                      background: expertiseLevel === 'Expert' ? 'rgba(139,92,246,0.1)' : expertiseLevel === 'Advanced' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                      border: expertiseLevel === 'Expert' ? '1px solid rgba(139,92,246,0.3)' : expertiseLevel === 'Advanced' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(34,197,94,0.3)',
                      color: expertiseLevel === 'Expert' ? '#a78bfa' : expertiseLevel === 'Advanced' ? '#60a5fa' : '#22c55e'
                    }}
                  >
                    {expertiseLevel}
                  </span>
                </div>

                <div className="w-full h-px bg-[#1e2233] mb-6"></div>

                <div className="w-full grid grid-cols-2 gap-4">
                  <div
                    className="text-center p-4 rounded-lg"
                    style={{ background: 'rgba(30,34,51,0.3)', border: '1px solid rgba(30,34,51,0.5)' }}
                  >
                    <p
                      className="text-[9px] text-slate-600 uppercase tracking-[0.2em] mb-1 font-bold"
                      style={{ fontFamily: 'monospace' }}
                    >
                      Reputation
                    </p>
                    <p className="font-display text-2xl font-black" style={{ color: '#22C55E' }}>
                      {reputationScore}
                    </p>
                  </div>
                  <div
                    className="text-center p-4 rounded-lg"
                    style={{ background: 'rgba(30,34,51,0.3)', border: '1px solid rgba(30,34,51,0.5)' }}
                  >
                    <p
                      className="text-[9px] text-slate-600 uppercase tracking-[0.2em] mb-1 font-bold"
                      style={{ fontFamily: 'monospace' }}
                    >
                      Joined
                    </p>
                    <p className="font-mono text-xs text-slate-200 mt-1">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '---'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="xl:col-span-2 space-y-6">
            {/* Status Messages */}
            {success && (
              <div
                className="rounded-lg flex items-center gap-3 p-4"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
              >
                <div className="w-8 h-8 rounded-full bg-toxic/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-sm">
                  Synchronized: Your profile updates have been successfully pushed to the network.
                </p>
              </div>
            )}

            {error && (
              <div
                className="rounded-lg flex items-center gap-3 p-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
              >
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identity Section */}
              <div
                className="rounded-xl p-6 border space-y-6"
                style={{
                  background: 'rgba(12,13,20,0.6)',
                  border: '1px solid rgba(30,34,51,0.8)',
                }}
              >
                <h3
                  className="font-display text-lg font-bold text-slate-100 flex items-center gap-3 pb-4 border-b border-phantom"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  Public Identity
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className="font-code text-[10px] uppercase tracking-widest block text-slate-500 mb-2"
                      style={{ fontFamily: 'monospace' }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleChange}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-3 rounded-lg font-body text-sm transition-colors"
                      style={{
                        background: 'rgba(12,13,20,0.8)',
                        border: '1px solid rgba(30,34,51,0.8)',
                        color: '#e2e8f0'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="font-code text-[10px] uppercase tracking-widest block text-slate-500 mb-2"
                      style={{ fontFamily: 'monospace' }}
                    >
                      Agent Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      placeholder="Describe your background and interests..."
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg font-body text-sm transition-colors resize-none"
                      style={{
                        background: 'rgba(12,13,20,0.8)',
                        border: '1px solid rgba(30,34,51,0.8)',
                        color: '#e2e8f0'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Specializations Section */}
              <div
                className="rounded-xl p-6 border space-y-4"
                style={{
                  background: 'rgba(12,13,20,0.6)',
                  border: '1px solid rgba(30,34,51,0.8)',
                }}
              >
                <h3
                  className="font-display text-lg font-bold text-slate-100 flex items-center gap-3 pb-4 border-b border-phantom"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </span>
                  Technical Specializations
                </h3>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.length === 0 ? (
                      <p
                        className="font-mono text-xs uppercase tracking-widest"
                        style={{ color: '#64748B' }}
                      >
                        No specializations registered yet.
                      </p>
                    ) : (
                      profile.specializations.map((spec, index) => (
                        <div
                          key={index}
                          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            background: 'rgba(30,34,51,0.5)',
                            border: '1px solid rgba(30,34,51,0.8)',
                            color: '#e2e8f0'
                          }}
                        >
                          <span className="font-body text-sm">{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialization(spec)}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={specInput}
                      onChange={(e) => setSpecInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization(e)}
                      placeholder="Add a specialization (e.g., Malware Analysis, Cryptography)"
                      className="flex-1 px-4 py-3 rounded-lg font-body text-sm transition-colors"
                      style={{
                        background: 'rgba(12,13,20,0.8)',
                        border: '1px solid rgba(30,34,51,0.8)',
                        color: '#e2e8f0'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSpecialization}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
                      style={{
                        background: '#22C55E',
                        color: '#0c0d10'
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>
                  <p
                    className="font-code text-[9px] uppercase tracking-widest text-slate-500"
                    style={{ fontFamily: 'monospace' }}
                  >
                    Press Enter or click Add to register expertise
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div
                className="rounded-xl p-6 border sticky bottom-4"
                style={{
                  background: 'rgba(12,13,20,0.8)',
                  border: '1px solid rgba(30,34,51,0.8)',
                }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p
                    className="font-mono text-xs text-slate-500 hidden sm:block"
                    style={{ fontFamily: 'monospace' }}
                  >
                    Changes will be propagated across the network.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-display text-sm font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: '#22C55E',
                      color: '#0c0d10',
                      border: '1px solid rgba(34,197,94,0.3)'
                    }}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0c0d10] border-t-transparent rounded-full animate-spin"></div>
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Push Updates
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCropper && (
        <AvatarCropper
          initialImage={null}
          onSave={handleAvatarSave}
          onClose={() => setShowCropper(false)}
        />
      )}
    </main>
  );
};

export default ProfilePage;
