import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  getFullUserProfile,
  updateFullUserProfile,
  uploadAvatar,
} from "../../services/userService";
import { Link, useNavigate } from "react-router-dom";
import AvatarCropper from "./Components/AvatarCropper";
import { getUserSubmissions, getUserStats } from "../../services/api";
import VerifiedBadge from "../Dashboard/Components/VerifiedBadge";
import ProfileSkeleton from "./Components/ProfileSkeleton";

const ACCENT = "#22C55E";

const ProfilePage = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_submissions: 0,
    published_submissions: 0,
    pending_submissions: 0,
  });

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
    specializations: [],
  });

  // Specialization input state
  const [specInput, setSpecInput] = useState("");

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);
  const [hoveredAvatar, setHoveredAvatar] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getFullUserProfile();
        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name || "",
            bio: data.profile.bio || "",
            avatar_url: data.profile.avatar_url || "",
            specializations: data.profile.specializations || [],
          });
          if (data.profile.avatar_url) {
            updateUser({
              ...user,
              profile: {
                ...user?.profile,
                avatar_url: data.profile.avatar_url,
              },
            });
          }
        }
      } catch {
        setError("Failed to load profile data.");
      }

      try {
        const statsRes = await getUserStats();
        setStats(
          statsRes.data || {
            total_submissions: 0,
            published_submissions: 0,
            pending_submissions: 0,
          },
        );
      } catch {
        // stats load failure is non-critical
      }

      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleAddSpecialization = (e) => {
    e.preventDefault();
    if (
      specInput.trim() &&
      !profile.specializations.includes(specInput.trim())
    ) {
      setProfile((prev) => ({
        ...prev,
        specializations: [...prev.specializations, specInput.trim()],
      }));
      setSpecInput("");
    }
  };

  const handleRemoveSpecialization = (specToRemove) => {
    setProfile((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== specToRemove),
    }));
  };

  const handleAvatarSave = async (croppedImageData) => {
    setShowCropper(false);
    setSaving(true);
    setError(null);
    try {
      const response = await uploadAvatar({ croppedImage: croppedImageData });
      const avatarPath = response.path;
      setProfile((prev) => ({ ...prev, avatar_url: avatarPath }));
      updateUser({
        ...user,
        profile: {
          ...user?.profile,
          avatar_url: avatarPath,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to upload avatar.");
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
        updateUser({
          ...response.user,
          profile: {
            ...user?.profile,
            full_name: profile.full_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            specializations: profile.specializations,
          },
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const reputationScore = user?.reputation_score ?? 0;
  const expertiseLevel = user?.expertise_level || "Beginner";
  const avatarSrc =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "Analyst")}&background=10b981&color=fff&size=256`;

  const expertiseColor =
    expertiseLevel === "Expert"
      ? "#A78BFA"
      : expertiseLevel === "Advanced"
        ? "#2563EB"
        : "#4ADE80";

  const expertiseBg =
    expertiseLevel === "Expert"
      ? "rgba(139,92,246,0.1)"
      : expertiseLevel === "Advanced"
        ? "rgba(59,130,246,0.1)"
        : "rgba(74,222,128,0.1)";

  const expertiseBorder =
    expertiseLevel === "Expert"
      ? "rgba(139,92,246,0.25)"
      : expertiseLevel === "Advanced"
        ? "rgba(59,130,246,0.25)"
        : "rgba(74,222,128,0.25)";

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <main className="flex-1 overflow-auto relative bg-white">
      <div className="px-7 py-8 max-w-[1440px] mx-auto space-y-6 animate-fade-up">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full bg-toxic"
                style={{ boxShadow: "0 0 8px rgba(34,197,94,0.8)" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-toxic">
                Profile
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
              Profile Settings
            </h1>
            <p className="font-mono text-[10px] mt-1 text-gray-500">
              Manage your account and profile information
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg"
              style={{
                background: expertiseBg,
                color: expertiseColor,
                border: `1px solid ${expertiseBorder}`,
              }}
            >
              {expertiseLevel}
            </span>
            <span className="font-code text-[10px] px-3 py-1.5 rounded-lg bg-toxic/10 text-toxic border border-toxic/20">
              {reputationScore} XP
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="rounded-lg flex items-center gap-3 p-4 bg-toxic/10 border border-toxic/20 text-toxic">
            <div className="w-8 h-8 rounded-full bg-toxic/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="font-medium text-sm">
              Profile synchronized successfully.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-500">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01"
                />
              </svg>
            </div>
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
            {/* Avatar Section */}
            <div className="p-6 border-b border-gray-200">
              <label className="font-code text-[10px] uppercase tracking-widest text-gray-500 block mb-4">
                Profile Photo
              </label>
              <div className="flex items-center gap-6">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 border-gray-200"
                  onMouseEnter={() => setHoveredAvatar(true)}
                  onMouseLeave={() => setHoveredAvatar(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {hoveredAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                        Change
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setShowCropper(true);
                    }}
                  />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-gray-900">
                    {user?.username || "Analyst"}
                  </p>
                  <p className="font-mono text-xs text-gray-500 mt-0.5">
                    {user?.email || ""}
                  </p>
                  <VerifiedBadge role={user?.role} size={12} />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200">
              <div className="bg-white p-5">
                <p className="font-display text-2xl font-bold text-gray-900">
                  {stats.total_submissions}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1">
                  Total Analyses
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="font-display text-2xl font-bold text-gray-900">
                  {stats.published_submissions}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1">
                  Published
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="font-display text-2xl font-bold text-gray-900">
                  {stats.pending_submissions}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1">
                  Pending Reviews
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="font-code text-[10px] uppercase tracking-widest text-gray-500 block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20 font-body"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="font-code text-[10px] uppercase tracking-widest text-gray-500 block mb-1.5">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20 font-body resize-none"
                />
              </div>

              {/* Specializations */}
              <div>
                <label className="font-code text-[10px] uppercase tracking-widest text-gray-500 block mb-1.5">
                  Specializations
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-toxic/10 text-toxic border border-toxic/20"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddSpecialization} className="flex gap-2">
                  <input
                    type="text"
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    placeholder="Add specialization..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20 font-body"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider bg-toxic text-white hover:bg-toxic/90 transition-all"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="font-mono text-[10px] text-gray-500">
                Changes will be propagated across the network.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-toxic text-white hover:bg-toxic/90"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Avatar Cropper Modal */}
        {showCropper && (
          <AvatarCropper
            initialImage={null}
            onSave={handleAvatarSave}
            onClose={() => setShowCropper(false)}
          />
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
