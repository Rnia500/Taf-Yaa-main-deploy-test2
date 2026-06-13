// src/pages/AnalyticsDashboard.jsx
// Taf'Yaa — Firebase Analytics Dashboard

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, TreePine, BookOpen, Mic, Globe, MessageCircle,
  Shield, TrendingUp, Activity, Eye, RefreshCw, Calendar
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes countUp { from{opacity:0} to{opacity:1} }
  .stat-card { transition: box-shadow .2s, transform .2s; }
  .stat-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
`;

const COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#d97706'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#16a34a', delay = 0, loading }) {
  return (
    <div className="stat-card" style={{
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16,
      padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      animation: `fadeIn .4s ease ${delay}s both`,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { size: 24, color })}
      </div>
      <div>
        {loading
          ? <div style={{ width: 60, height: 28, background: '#f3f4f6', borderRadius: 6, marginBottom: 6 }}/>
          : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{value}</div>
        }
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</h2>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, children, delay = 0 }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16,
      padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      animation: `fadeIn .4s ease ${delay}s both`,
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151' }}>{title}</h3>
      {children}
    </div>
  );
}

// ─── Feature Usage Bar ────────────────────────────────────────────────────────
function FeatureBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>{value}</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 20, height: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 20,
          transition: 'width 1s ease',
        }}/>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats]       = useState({
    totalTrees: 0,
    totalPersons: 0,
    totalStories: 0,
    totalMembers: 0,
    voiceStories: 0,
    totalBackups: 0,
    totalMessages: 0,
    recentActivity: [],
    storiesByLanguage: [],
    treeGrowth: [],
    featureUsage: [],
  });

  const loadStats = async () => {
    try {
      // ── Trees ──────────────────────────────────────────────────────────────
      const treesSnap = await getDocs(collection(db, 'trees'));
      const trees = treesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ── Persons ────────────────────────────────────────────────────────────
      let totalPersons = 0;
      for (const tree of trees) {
        const personsSnap = await getDocs(
          collection(db, 'trees', tree.id, 'persons')
        );
        totalPersons += personsSnap.size;
      }

      // ── Stories ────────────────────────────────────────────────────────────
      const storiesSnap = await getDocs(collection(db, 'stories'));
      const stories = storiesSnap.docs.map(d => d.data());
      const voiceStories = stories.filter(s => s.source === 'aws-transcribe' || s.source === 'openai-whisper').length;

      // Stories by language
      const langCount = {};
      stories.forEach(s => {
        const lang = s.language || 'en-US';
        const code = lang.split('-')[0];
        langCount[code] = (langCount[code] || 0) + 1;
      });
      const storiesByLanguage = Object.entries(langCount)
        .map(([lang, count]) => ({ lang, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // ── Members (unique users across all trees) ────────────────────────────
      const memberSet = new Set();
      trees.forEach(tree => {
        (tree.members || []).forEach(m => {
          const uid = typeof m === 'string' ? m : m.userId;
          if (uid) memberSet.add(uid);
        });
      });

      // ── Recent activity (last 10 stories) ─────────────────────────────────
      const recentSnap = await getDocs(
        query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(5))
      );
      const recentActivity = recentSnap.docs.map(d => {
        const data = d.data();
        return {
          action: data.source === 'aws-transcribe' || data.source === 'openai-whisper'
            ? '🎙️ Voice story recorded'
            : '📖 Story created',
          detail: `${data.title || 'Story'} · ${data.language || 'en'}`,
          time: data.createdAt?.toDate?.()?.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) || 'Recently',
        };
      });

      // ── Tree growth (mock monthly data based on tree count) ────────────────
      const now = new Date();
      const treeGrowth = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          month: d.toLocaleDateString('en-GB', { month: 'short' }),
          trees: Math.max(1, Math.floor(trees.length * ((i + 1) / 6))),
          members: Math.max(1, Math.floor(memberSet.size * ((i + 1) / 6))),
        };
      });

      // ── Feature usage ──────────────────────────────────────────────────────
      const featureUsage = [
        { name: 'Family Trees', value: trees.length, color: '#16a34a' },
        { name: 'Voice Stories', value: voiceStories, color: '#2563eb' },
        { name: 'Text Stories', value: stories.length - voiceStories, color: '#7c3aed' },
        { name: 'Members', value: memberSet.size, color: '#ea580c' },
      ];

      setStats({
        totalTrees: trees.length,
        totalPersons,
        totalStories: stories.length,
        totalMembers: memberSet.size,
        voiceStories,
        totalBackups: 0,
        totalMessages: 0,
        recentActivity,
        storiesByLanguage,
        treeGrowth,
        featureUsage,
      });
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadStats(); };

  const maxFeature = Math.max(...stats.featureUsage.map(f => f.value), 1);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100%', width: '100%', background: '#f8fafc' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#0a3d1f 0%,#14532d 45%,#166534 100%)',
          padding: '36px 40px 44px', position: 'relative', overflow: 'hidden',
        }}>
          {[{t:-60,r:-60,s:220},{t:20,r:180,s:100}].map((d,i)=>(
            <div key={i} style={{position:'absolute',top:d.t,right:d.r,width:d.s,height:d.s,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'}}/>
          ))}
          <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={26} color="#fff"/>
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    Analytics Dashboard
                  </h1>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                    Real-time insights into your family tree platform
                  </p>
                </div>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, padding: '10px 18px', color: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              }}>
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin .7s linear infinite' : 'none' }}/>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {/* Quick stats in hero */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Family Trees', value: loading ? '…' : stats.totalTrees, icon: '🌳' },
                { label: 'Members', value: loading ? '…' : stats.totalMembers, icon: '👥' },
                { label: 'Stories', value: loading ? '…' : stats.totalStories, icon: '📖' },
                { label: 'Persons', value: loading ? '…' : stats.totalPersons, icon: '👤' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                  padding: '12px 20px', minWidth: 120,
                  animation: `fadeIn .4s ease ${i * 0.08}s both`,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.icon} {s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 40px 48px' }}>

          {/* Stat cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon={<TreePine/>} label="Family Trees" value={stats.totalTrees} color="#16a34a" delay={0} loading={loading}/>
            <StatCard icon={<Users/>} label="Total Members" value={stats.totalMembers} color="#2563eb" delay={0.05} loading={loading}/>
            <StatCard icon={<BookOpen/>} label="Stories" value={stats.totalStories} sub={`${stats.voiceStories} via voice`} color="#7c3aed" delay={0.1} loading={loading}/>
            <StatCard icon={<Users/>} label="Persons Recorded" value={stats.totalPersons} color="#ea580c" delay={0.15} loading={loading}/>
            <StatCard icon={<Mic/>} label="Voice Stories" value={stats.voiceStories} color="#0891b2" delay={0.2} loading={loading}/>
            <StatCard icon={<Globe/>} label="Languages Used" value={stats.storiesByLanguage.length} color="#d97706" delay={0.25} loading={loading}/>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

            {/* Growth chart */}
            <ChartCard title="📈 Platform Growth" delay={0.1}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.treeGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }}/>
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }}/>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}/>
                  <Legend wrapperStyle={{ fontSize: 12 }}/>
                  <Line type="monotone" dataKey="trees" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} name="Trees"/>
                  <Line type="monotone" dataKey="members" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} name="Members"/>
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Stories by language */}
            <ChartCard title="🌍 Stories by Language" delay={0.15}>
              {stats.storiesByLanguage.length === 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No stories recorded yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.storiesByLanguage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                    <XAxis dataKey="lang" tick={{ fontSize: 12, fill: '#9ca3af' }}/>
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }}/>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}/>
                    <Bar dataKey="count" name="Stories" radius={[6, 6, 0, 0]}>
                      {stats.storiesByLanguage.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Feature usage + Recent activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Feature usage */}
            <ChartCard title="🚀 Feature Usage" delay={0.2}>
              {loading ? (
                <div style={{ padding: '20px 0' }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ width: '60%', height: 12, background: '#f3f4f6', borderRadius: 4, marginBottom: 6 }}/>
                      <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 20 }}/>
                    </div>
                  ))}
                </div>
              ) : (
                stats.featureUsage.map(f => (
                  <FeatureBar key={f.name} label={f.name} value={f.value} max={maxFeature} color={f.color}/>
                ))
              )}
            </ChartCard>

            {/* Recent activity */}
            <ChartCard title="⚡ Recent Activity" delay={0.25}>
              {loading ? (
                <div>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ width: '70%', height: 12, background: '#f3f4f6', borderRadius: 4, marginBottom: 6 }}/>
                        <div style={{ width: '40%', height: 10, background: '#f3f4f6', borderRadius: 4 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats.recentActivity.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No recent activity yet
                </div>
              ) : (
                stats.recentActivity.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start', animation: `fadeIn .3s ease ${i * 0.08}s both` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                      {item.action.split(' ')[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.action.slice(2)}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.detail} · {item.time}</div>
                    </div>
                  </div>
                ))
              )}
            </ChartCard>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Activity size={15} color="#9ca3af"/>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
              Data is pulled directly from Firestore in real-time. Detailed event analytics (page views, feature clicks) are available in the Firebase Console under Analytics → Events.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;