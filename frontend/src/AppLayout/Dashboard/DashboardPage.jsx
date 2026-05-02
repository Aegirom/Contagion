import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getUserSubmissions, getUserStats, getDashboardActivity, getAnalystReputation, getQuickActions } from '../../services/api';
import StatCard from './Components/StatCard';
import ActivityFeed from './Components/ActivityFeed';
import QuickActions from './Components/QuickActions';
import SubmissionsTable from './Components/SubmissionsTable';
import RankPanel from './Components/RankPanel';
import PlusButton from './Components/Buttons';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activityItems, setActivityItems] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all dashboard data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, submissionsData, activityData, reputationData, quickActionsData] = await Promise.all([
          getUserStats(),
          getUserSubmissions(),
          getDashboardActivity().then(r => r.data).catch(() => ({ items: [] })),
          getAnalystReputation().then(r => r.data).catch(() => null),
          getQuickActions().then(r => r.data).catch(() => [])
        ]);

        setStats(statsData);
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        setActivityItems(activityData.items || []);
        setReputation(reputationData);
        setQuickActions(quickActionsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Placeholder data for when no data is available
  const placeholderStats = {
    total_submissions: 0,
    published_submissions: 0,
    pending_submissions: 0
  };

  const statsData = stats || placeholderStats;

  // Transform submissions for the table component
  const transformedSubmissions = submissions.map((sub) => ({
    id: sub.submission_id,
    hash: sub.title?.substring(0, 8) || 'N/A',
    family: sub.template_type || 'Unknown',
    threat: 'MEDIUM',
    status: sub.status === 'Published' ? 'Completed' : sub.status,
    date: new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: 85
  })).slice(0, 6);

  // Activity items - use API data or fallback placeholder
  const displayActivityItems = loading
    ? [{ type: 'placeholder', msg: 'Loading activity...', time: '...', color: '#475569' }]
    : (activityItems.length > 0 ? activityItems : [{ type: 'placeholder', msg: 'No activity yet', time: 'Join now', color: '#475569' }]);

  // Empty state for submissions
  const hasNoSubmissions = !loading && transformedSubmissions.length === 0;

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="px-8 py-10 max-w-[1600px] mx-auto space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-white">
              Welcome back, <span style={{ color: '#22C55E' }}>{user?.username || 'Analyst'}</span>
            </h2>
            <p className="font-body text-sm mt-2" style={{ color: '#475569' }}>
              Threat intelligence overview
            </p>
          </div>
          <PlusButton text="New Analysis" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Analyses"
            value={statsData.total_submissions || '0'}
            suffix=""
            change="+14%"
            changePos={true}
            color="22C55E"
            loading={loading}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          />
          <StatCard
            label="Published"
            value={statsData.published_submissions || '0'}
            suffix=""
            change={statsData.published_submissions > 0 ? '+Active' : 'N/A'}
            changePos={true}
            color="8B5CF6"
            loading={loading}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><polyline points="15 2 15 7 20 7" /><line x1="16" y1="11" x2="8" y2="11" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
          />
          <StatCard
            label="Reputation Score"
            value={reputation?.reputation_score || user?.reputation_score || '0'}
            suffix=" XP"
            change={reputation?.reputation_score || user?.reputation_score > 0 ? '+180' : 'N/A'}
            changePos={true}
            color="F59E0B"
            loading={loading}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
          />
          <StatCard
            label="Pending Reviews"
            value={statsData.pending_submissions || '0'}
            suffix=""
            change={statsData.pending_submissions > 0 ? 'LIVE' : 'All Clear'}
            changePos={true}
            color="22D3EE"
            loading={loading}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {hasNoSubmissions ? (
              <div className="border-2 border-dashed border-phantom rounded-xl p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#1E2233] flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                <p className="text-[#475569] mb-6">Start your first malware analysis submission to build your portfolio.</p>
                <PlusButton text="Create Analysis" />
              </div>
            ) : (
              <SubmissionsTable submissions={transformedSubmissions} loading={loading} />
            )}
          </div>

          <div className="space-y-6">
            <ActivityFeed items={displayActivityItems} loading={loading} />
            <QuickActions loading={loading} actions={quickActions} />
          </div>
        </div>

        <RankPanel loading={loading} reputation={reputation} />
      </div>
    </main>
  );
};

export default DashboardPage;
