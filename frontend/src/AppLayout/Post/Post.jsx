import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeverityBadge, StatusBadge } from '../Dashboard/Components/HooksAndBadges';
import { evaluateSandboxFile, getSubmissionById } from '../../services/api';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const parseLogData = (log) => {
  try {
    return typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
  } catch {
    return log.log_data;
  }
};

const summarizeLog = (log) => {
  const data = parseLogData(log);
  if (!data || typeof data !== 'object') return 'Raw behavioral data captured';

  const counts = Object.entries(data)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value.length}`)
    .slice(0, 3);

  return counts.length ? counts.join(' • ') : 'Structured telemetry captured';
};

const severityFromCategory = (category) => {
  if (['Ransomware', 'APT', 'Rootkit'].includes(category)) return 'CRITICAL';
  if (['Trojan', 'Worm', 'Spyware'].includes(category)) return 'HIGH';
  return 'INFO';
};

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const loadPost = useCallback(async () => {
    setError('');
    try {
      const response = await getSubmissionById(postId);
      setPost(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analysis report');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const logs = useMemo(() => post?.behavioral_logs || [], [post]);
  const score = post?.sandbox_status === 'Completed' ? 100 : logs.length ? 65 : 0;
  const threat = severityFromCategory(post?.malware_category);

  const handleRunSandbox = async () => {
    if (!post?.sha256_hash) return;
    setRunning(true);
    setError('');
    try {
      await evaluateSandboxFile({
        submission_id: post.submission_id,
        file_hash: post.sha256_hash,
        environment: 'Docker',
        os_profile: 'Windows10',
        network_enabled: false,
        timeout_seconds: 120,
      });
      await loadPost();
    } catch (err) {
      setError(err.response?.data?.error || 'Sandbox evaluation failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center font-code text-xs uppercase tracking-widest text-slate-500">
          Loading analysis report...
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
          <p className="font-code text-sm text-red-400">{error || 'Analysis report not found'}</p>
          <button onClick={() => navigate('/submissions')} className="mt-4 font-code text-xs uppercase tracking-widest text-toxic">
            Return to submissions
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 font-code text-xs transition-colors"
          style={{ color: '#475569' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#22C55E')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          RETURN
        </button>

        {error && (
          <div className="mb-6 rounded border border-red-900/40 bg-red-900/10 px-4 py-3 font-code text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold" style={{ color: '#F1F5F9' }}>
                    {post.title}
                  </h2>
                  <p className="font-code text-xs mt-2" style={{ color: '#475569' }}>
                    SUBMITTED BY <span style={{ color: '#22C55E' }}>{post.username}</span> • {new Date(post.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SeverityBadge level={threat} />
                  <StatusBadge status={post.sandbox_status || post.status} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0A0B10] border border-white/5">
                  <span className="font-code text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#475569' }}>SHA-256 HASH</span>
                  <code className="font-code text-xs break-all" style={{ color: '#22C55E' }}>
                    {post.sha256_hash || 'No artifact linked'}
                  </code>
                </div>
                <p className="font-body text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#94A3B8' }}>
                  {post.content}
                </p>
              </div>

              {post.sha256_hash && (
                <button
                  onClick={handleRunSandbox}
                  disabled={running}
                  className="mt-6 rounded-lg bg-[#22C55E] px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-[#0A0B10] disabled:opacity-50"
                >
                  {running ? 'Running Sandbox...' : 'Run Sandbox'}
                </button>
              )}
            </div>

            <div
              className="rounded-xl overflow-hidden border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
                animationDelay: '100ms',
              }}
            >
              <div className="px-6 py-4 border-b border-[rgba(30,34,51,0.5)] bg-white/5">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: '#F1F5F9' }}>
                  Behavioral Indicators
                </h3>
              </div>
              <div className="divide-y divide-[rgba(30,34,51,0.3)]">
                {logs.map((log) => (
                  <div key={log.log_id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div>
                      <span className="font-code text-[10px] text-[#22C55E] uppercase tracking-widest block mb-1">{log.log_type}</span>
                      <p className="font-body text-sm" style={{ color: '#F1F5F9' }}>{summarizeLog(log)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded font-code text-[9px] tracking-widest border border-red-500/20 bg-red-500/10 text-red-400">
                      CAPTURED
                    </span>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="px-6 py-12 text-center font-code text-xs uppercase tracking-widest text-slate-600">
                    No behavioral logs captured yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
                animationDelay: '200ms',
              }}
            >
              <h3 className="font-display text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#475569' }}>
                Sandbox Score
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.42}
                      strokeDashoffset={364.42 - (364.42 * score) / 100}
                      className={score >= 80 ? 'text-[#EF4444]' : 'text-[#22C55E]'}
                      style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.4))' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-display text-3xl font-bold" style={{ color: '#F1F5F9' }}>{score}</span>
                    <span className="font-code text-[10px] text-[#475569]">/ 100</span>
                  </div>
                </div>
                <p className="mt-4 font-code text-[10px] text-center" style={{ color: '#22C55E' }}>
                  {post.sandbox_status || 'NOT QUEUED'}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
                animationDelay: '300ms',
              }}
            >
              <h3 className="font-display text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>
                Artifact Metadata
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'File Name', value: post.file_name || 'None' },
                  { label: 'File Type', value: post.file_type || 'Unknown' },
                  { label: 'File Size', value: formatBytes(post.file_size) },
                  { label: 'Category', value: post.malware_category || 'Other' },
                  { label: 'Quarantined', value: post.is_quarantined ? 'Yes' : 'No' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center gap-4">
                    <span className="font-code text-[10px]" style={{ color: '#475569' }}>{item.label}</span>
                    <span className="font-code text-xs text-right break-all" style={{ color: '#F1F5F9' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Post;
