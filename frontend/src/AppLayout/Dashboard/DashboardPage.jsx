import { useState, useEffect } from 'react';
import StatCard from './Components/StatCard';
import ActivityFeed from './Components/ActivityFeed';
import QuickActions from './Components/QuickActions';
import SubmissionsTable from './Components/SubmissionsTable';
import RankPanel from './Components/RankPanel';
import PlusButton from './Components/Buttons';

const DashboardPage = () => {
  const stats = [
    { label: 'Total Analyses', value: '1,247', suffix: '', change: '+14%', changePos: true, color: '22C55E', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, delay: 0 },
    { label: 'Threats Detected', value: '389', suffix: '', change: '+23%', changePos: true, color: 'EF4444', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, delay: 100 },
    { label: 'Reputation Score', value: '2,450', suffix: ' XP', change: '+180', changePos: true, color: '8B5CF6', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>, delay: 200 },
    { label: 'Active Sandboxes', value: '3', suffix: '', change: 'LIVE', changePos: true, color: '22D3EE', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>, delay: 300 },
  ];

  const submissions = [
    { id: 1, hash: '7f3ab9c1d2e4', family: 'Emotet', threat: 'CRITICAL', status: 'Completed', date: '2 hrs ago', score: 94 },
    { id: 2, hash: 'a1b2c3d4e5f6', family: 'AsyncRAT', threat: 'HIGH', status: 'Analyzing', date: '4 hrs ago', score: 81 },
    { id: 3, hash: 'f9e8d7c6b5a4', family: 'Mirai Botnet', threat: 'HIGH', status: 'Peer Review', date: '6 hrs ago', score: 77 },
    { id: 4, hash: '3c4d5e6f7a8b', family: 'LockBit 3.0', threat: 'CRITICAL', status: 'Completed', date: '1 day ago', score: 98 },
    { id: 5, hash: 'b1c2d3e4f5a6', family: 'Cobalt Strike', threat: 'HIGH', status: 'Queued', date: '1 day ago', score: null },
    { id: 6, hash: '9a8b7c6d5e4f', family: 'XMRig Miner', threat: 'MEDIUM', status: 'Completed', date: '2 days ago', score: 62 },
  ];

  const activityItems = [
    { type: 'threat', msg: 'Critical threat detected in sample 7f3ab9c1', time: '2m ago', color: '#EF4444' },
    { type: 'badge', msg: 'Achievement: Ransomware Analyst', time: '1h ago', color: '#F59E0B' },
    { type: 'review', msg: 'Peer review assigned for LockBit', time: '3h ago', color: '#8B5CF6' },
    { type: 'rank', msg: 'Rank #42 on leaderboard', time: '5h ago', color: '#22D3EE' },
    { type: 'ai', msg: 'AI eval: 94% accuracy', time: '6h ago', color: '#22C55E' },
  ];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="px-8 py-10 max-w-[1600px] mx-auto space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-white">
              Welcome back, <span style={{ color: '#22C55E' }}>Mr Epstein</span>
            </h2>
            <p className="font-body text-sm mt-2" style={{ color: '#475569' }}>
              Threat intelligence overview
            </p>
          </div>
          <PlusButton text="New Analysis" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} loading={loading} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SubmissionsTable submissions={submissions} loading={loading} />
          </div>

          <div className="space-y-6">
            <ActivityFeed items={activityItems} loading={loading} />
            <QuickActions loading={loading} />
          </div>
        </div>

        <RankPanel loading={loading} />
      </div>
    </main>
  );
};

export default DashboardPage;
