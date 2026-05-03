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

const ACCENT = "#22C55E";

const ProfilePage = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total_submissions: 0, published_submissions: 0, pending_submissions: 0 });

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
        setStats(statsRes.data || { total_submissions: 0, published_submissions: 0, pending_submissions: 0 });
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
  const avatarSrc = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "Analyst")}&background=10b981&color=fff&size=256`;

  const expertiseColor = expertiseLevel === "Expert"
    ? "#A78BFA"
    : expertiseLevel === "Advanced"
      ? "#60A5FA"
      : "#4ADE80";

  const expertiseBg = expertiseLevel === "Expert"
    ? "rgba(139,92,246,0.1)"
    : expertiseLevel === "Advanced"
      ? "rgba(59,130,246,0.1)"
      : "rgba(74,222,128,0.1)";

  const expertiseBorder = expertiseLevel === "Expert"
    ? "rgba(139,92,246,0.25)"
    : expertiseLevel === "Advanced"
      ? "rgba(59,130,246,0.25)"
      : "rgba(74,222,128,0.25)";

  if (loading) {
    return (
      <main className="flex-1 overflow-auto relative" style={{ background: "#050508" }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-toxic border-t-transparent mb-4"></div>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto relative" style={{ background: "#050508" }}>
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: "900px", height: "600px", top: "-200px", right: "-300px", background: "radial-gradient(ellipse, rgba(34,197,94,0.04) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", width: "700px", height: "700px", bottom: "-250px", left: "-150px", background: "radial-gradient(ellipse, rgba(109,40,217,0.035) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.012) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative px-7 py-8 max-w-[1440px] mx-auto space-y-6" style={{ zIndex: 1 }}>

      {/* Status Messages */}
      {success && (
        <div className="rounded-lg flex items-center gap-3 p-4" style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22C55E",
        }}>
          <div className="w-8 h-8 rounded-full bg-toxic/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-sm">Profile synchronized successfully.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg flex items-center gap-3 p-4" style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#EF4444",
        }}>
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Profile Header */}
      <div className="rounded-xl overflow-hidden" style={{
        background: "#0A0B10",
        border: "1px solid #1E2233",
      }}>
        {/* Banner */}
        <div className="relative h-28 md:h-36 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(109,40,217,0.1) 50%, rgba(10,11,16,0.6) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{
            background: "linear-gradient(to top, #0A0B10, transparent)",
          }} />
        </div>

        {/* Profile Info */}
        <div className="relative px-6 pb-6 -mt-14">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => setHoveredAvatar(true)}
              onMouseLeave={() => setHoveredAvatar(false)}
            >
              <div className={`w-32 h-32 rounded-full overflow-hidden ring-4 transition-all duration-300 ${hoveredAvatar ? "ring-toxic/40 scale-105" : "ring-[#1e2233]"}`} style={{ background: "#0c0d10" }}>
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setShowCropper(true)}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: ACCENT,
                  color: "#0c0d10",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Name & Role */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                <h1 className="font-display text-2xl font-black text-slate-100 tracking-tight">
                  {user?.username || "Unknown Agent"}
                </h1>
                <VerifiedBadge role={user?.role} size={18} />
              </div>
              <p className="font-mono text-xs text-slate-500 mt-1">{user?.email}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    color: ACCENT,
                  }}
                >
                  {user?.role || "ANALYST"}
                </span>
                <span
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md"
                  style={{
                    background: expertiseBg,
                    border: `1px solid ${expertiseBorder}`,
                    color: expertiseColor,
                  }}
                >
                  {expertiseLevel}
                </span>
                <span
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md"
                  style={{
                    background: "rgba(109,40,217,0.1)",
                    border: "1px solid rgba(109,40,217,0.2)",
                    color: "#A78BFA",
                  }}
                >
                  Rep: {reputationScore}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 self-end md:self-start md:pt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-code text-[10px] uppercase tracking-wider transition-all"
                style={{
                  background: "rgba(10,11,16,0.5)",
                  border: "1px solid #1E2233",
                  color: "#64748B",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(30,34,51,0.8)"; e.currentTarget.style.color = "#64748B"; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-code text-[10px] uppercase tracking-wider transition-all"
                style={{
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#EF4444",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Reputation */}
        <div className="rounded-xl overflow-hidden group" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
          transition: "border-color 0.3s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E2233"; }}
        >
          <div style={{
            height: "2px",
            background: "linear-gradient(to right, #22C55E, transparent)",
            opacity: 0.6,
          }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <svg className="w-4 h-4" fill="none" stroke="#22C55E" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-slate-100">{reputationScore}</p>
            <p className="font-body text-[10px] text-slate-500 uppercase tracking-wider mt-1">Reputation</p>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="rounded-xl overflow-hidden" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E2233"; }}
        >
          <div style={{
            height: "2px",
            background: "linear-gradient(to right, #3b82f6, transparent)",
            opacity: 0.6,
          }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.12)" }}>
                <svg className="w-4 h-4" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-slate-100">{stats.total_submissions}</p>
            <p className="font-body text-[10px] text-slate-500 uppercase tracking-wider mt-1">Submissions</p>
          </div>
        </div>

        {/* Published */}
        <div className="rounded-xl overflow-hidden" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E2233"; }}
        >
          <div style={{
            height: "2px",
            background: "linear-gradient(to right, #8b5cf6, transparent)",
            opacity: 0.6,
          }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}>
                <svg className="w-4 h-4" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-slate-100">{stats.published_submissions}</p>
            <p className="font-body text-[10px] text-slate-500 uppercase tracking-wider mt-1">Published</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="rounded-xl overflow-hidden" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E2233"; }}
        >
          <div style={{
            height: "2px",
            background: "linear-gradient(to right, #f59e0b, transparent)",
            opacity: 0.6,
          }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)" }}>
                <svg className="w-4 h-4" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="font-display text-lg font-bold text-slate-100">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
                : "—"}
            </p>
            <p className="font-body text-[10px] text-slate-500 uppercase tracking-wider mt-1">Member Since</p>
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Public Identity */}
        <div className="rounded-xl overflow-hidden" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
        }}>
          <div style={{ height: "2px", background: "linear-gradient(to right, #22C55E, transparent 60%)" }} />
          <div className="p-6 space-y-5">
            <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-3 pb-3 border-b border-phantom">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", color: ACCENT }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Public Identity
            </h3>

            <div className="space-y-4">
              <div>
                <label className="font-code text-[10px] uppercase tracking-widest block text-slate-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 rounded-lg font-body text-sm transition-all focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20"
                  style={{
                    background: "rgba(10,11,16,0.6)",
                    border: "1px solid #1E2233",
                    color: "#F1F5F9",
                  }}
                />
              </div>

              <div>
                <label className="font-code text-[10px] uppercase tracking-widest block text-slate-500 mb-2">
                  Agent Bio
                </label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Describe your background and interests..."
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg font-body text-sm transition-all resize-none focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20"
                  style={{
                    background: "rgba(10,11,16,0.6)",
                    border: "1px solid #1E2233",
                    color: "#F1F5F9",
                  }}
                />
                <p className="font-code text-[9px] text-slate-600 mt-1.5">
                  {profile.bio.length}/500 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specializations */}
        <div className="rounded-xl overflow-hidden" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
        }}>
          <div style={{ height: "2px", background: "linear-gradient(to right, #3b82f6, transparent 60%)" }} />
          <div className="p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-3 pb-3 border-b border-phantom">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </span>
              Technical Specializations
            </h3>

            <div className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {profile.specializations.length === 0 ? (
                  <div className="w-full py-3 rounded-lg border border-dashed border-phantom text-center">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">No specializations registered yet</p>
                  </div>
                ) : (
                  profile.specializations.map((spec) => (
                    <div
                      key={spec}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: "rgba(30,34,51,0.4)",
                        border: "1px solid rgba(30,34,51,0.6)",
                        color: "#F1F5F9",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(30,34,51,0.6)"; }}
                    >
                      <span className="font-body text-sm">{spec}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddSpecialization(e)
                  }
                  placeholder="Malware Analysis, Reverse Engineering, Cryptography..."
                  className="flex-1 px-4 py-2.5 rounded-lg font-body text-sm transition-all focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20"
                  style={{
                    background: "rgba(10,11,16,0.6)",
                    border: "1px solid #1E2233",
                    color: "#F1F5F9",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSpecialization}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-code text-[10px] uppercase tracking-wider transition-all hover:shadow-[0_0_16px_rgba(34,197,94,0.15)]"
                  style={{
                    background: ACCENT,
                    color: "#0c0d10",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#4ADE80"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="rounded-xl p-5" style={{
          background: "#0A0B10",
          border: "1px solid #1E2233",
        }}>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-slate-600 hidden sm:block">
              Changes will be propagated across the network.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-display text-sm font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: ACCENT,
                color: "#0c0d10",
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#4ADE80"; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = ACCENT; }}
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
