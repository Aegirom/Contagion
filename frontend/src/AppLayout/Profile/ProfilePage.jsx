import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getFullUserProfile, updateFullUserProfile, uploadAvatar } from '../../services/userService';
import { Link } from 'react-router-dom';
import AvatarCropper from './Components/AvatarCropper';

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    specializations: []
  });

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAvatar, setCroppedAvatar] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getFullUserProfile();
        if (data.user) {
          // Merge user data from API with existing user context
          setUserContext(data.user);
        }
        if (data.profile) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Helper to update user context with fresh data
  const setUserContext = (userData) => {
    // Update localStorage with fresh user data
    const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...existingUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Also update AuthContext
    // Since we can't directly set AuthContext from here, refresh the page or use event
    // For now, we'll just use the fresh data from our local state
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
  };

  const handleAvatarSave = async (croppedImageData) => {
    setShowCropper(false);
    setSaving(true);
    try {
      // Upload avatar to backend
      const response = await uploadAvatar({ croppedImage: croppedImageData });
      console.log('Avatar upload response:', response);
      // Update local profile with the actual avatar path from backend
      const avatarPath = response.data?.path || response.path;
      setProfile(prev => ({ ...prev, avatar_url: avatarPath || `/uploads/avatars/avatar_${Date.now()}.jpg` }));
      setSuccess(true);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setSaving(false);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload avatar. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await updateFullUserProfile(profile);
      console.log('Profile update response:', response);
      setSuccess(true);
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaving(false);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile. Please try again.';
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#22C55E] border-t-transparent mb-4"></div>
          <p className="text-[#475569]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss text-slate-100 px-6 py-12 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[#22C55E] hover:text-[#4ade80] transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl font-black tracking-tight text-white">Profile Settings</h1>
          <p className="text-slate-400 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="md:col-span-1">
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(30,34,51,0.7)' }}
            >
              <div className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  {profile.avatar_url ? (
                    <div
                      className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#22C55E] shadow-lg"
                      style={{
                        backgroundImage: `url(${profile.avatar_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center font-display text-2xl font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                        color: '#050508',
                        boxShadow: '0 0 20px rgba(34,197,94,0.4)',
                      }}
                    >
                      {user?.username?.charAt(0) || 'A'}
                    </div>
                  )}
                  <button
                    onClick={() => setShowCropper(true)}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center border-4 border-[#0a0b10] hover:bg-[#4ade80] transition-colors"
                    title="Update Avatar"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
                <h2 className="font-display text-xl font-bold text-white">{user?.username || 'Analyst'}</h2>
                <p className="text-[#475569] text-sm mt-2">{user?.email || 'analyst@contagion.sec'}</p>
                {profile.specializations && profile.specializations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 justify-center">
                    {profile.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="badge-info text-[9px]"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(30,34,51,0.7)' }}>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">Reputation Score</p>
                    <p className="font-display text-2xl font-bold text-[#22C55E]">
                      {user?.reputation_score || 0} <span className="text-sm font-normal text-[#64748B]">XP</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">Role</p>
                    <p className="font-body text-lg text-white capitalize">{user?.role?.toLowerCase() || 'analyst'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">Expertise Level</p>
                    <p className="font-body text-lg text-white">{user?.expertise_level || 'Beginner'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div
                className="rounded-xl p-6"
                style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(30,34,51,0.7)' }}
              >
                <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={profile.full_name || ''}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-lg bg-[#050508] border border-[#1E2233] focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={profile.bio || ''}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg bg-[#050508] border border-[#1E2233] focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-white transition-all outline-none resize-none"
                    />
                    <p className="text-xs text-[#64748B] mt-2">Brief description for your profile.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Avatar</label>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden bg-[#0a0a0f] border border-[#1E2233]"
                        style={{
                          backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!profile.avatar_url && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-display text-xl font-bold text-[#64748B]">
                              {user?.username?.charAt(0) || 'A'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCropper(true)}
                        className="px-4 py-2 rounded-lg bg-[#1E2233] hover:bg-[#2d3748] text-[#94A3B8] transition-colors text-sm font-medium"
                      >
                        {profile.avatar_url ? 'Change Avatar' : 'Upload Avatar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div
                className="rounded-xl p-6"
                style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(30,34,51,0.7)' }}
              >
                <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-[#1E2233] text-[#64748B] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#64748B] mt-2">Email cannot be changed.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Username</label>
                    <input
                      type="text"
                      disabled
                      value={user?.username || ''}
                      className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-[#1E2233] text-[#64748B] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Expertise Level</label>
                    <input
                      type="text"
                      disabled
                      value={user?.expertise_level || 'Beginner'}
                      className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-[#1E2233] text-[#64748B] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#EF4444] mt-2">Admin-only setting - contact administrator to change</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 flex-1"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.15)'; }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#22C55E] border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-[#EF4444] border border-[#EF4444]/20"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>

                {success && (
                  <span className="flex items-center gap-2 text-[#22C55E]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Profile updated successfully!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Avatar Cropper Modal */}
      {showCropper && (
        <AvatarCropper
          initialImage={null}
          onSave={handleAvatarSave}
          onClose={() => setShowCropper(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
