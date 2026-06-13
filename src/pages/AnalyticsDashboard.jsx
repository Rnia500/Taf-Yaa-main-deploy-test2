// src/pages/AnalyticsDashboard.jsx
// Taf’Yaa — Integrated SaaS Analytics Dashboard (FINAL CLEAN UI)

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import { db } from "../config/firebase";
import AdminNavbar from "../components/navbar/AdminNavbar";

import {
  Users, TreePine, BookOpen,
  Image, Heart, Activity, Globe
} from "lucide-react";

import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

// ───────────────────────────────

const Card = ({ icon, label, value, color }) => (
  <div style={{
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    gap: 12,
    alignItems: "center",
    border: "1px solid #eee"
  }}>
    <div style={{
      background: `${color}20`,
      padding: 10,
      borderRadius: 10
    }}>
      {React.cloneElement(icon, { color })}
    </div>

    <div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
    </div>
  </div>
);

// ───────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData] = useState({
    trees: [],
    users: [],
    people: [],
    stories: [],
    media: [],
    marriages: [],
    activities: []
  });

  // ───────── REALTIME FIRESTORE ─────────

  useEffect(() => {
    const unsub = (path, key) =>
      onSnapshot(collection(db, path), snap =>
        setData(prev => ({ ...prev, [key]: snap.docs.map(d => d.data()) }))
      );

    const cleanups = [
      unsub("trees", "trees"),
      unsub("users", "users"),
      unsub("people", "people"),
      unsub("stories", "stories"),
      unsub("media", "media"),
      unsub("marriages", "marriages"),
      onSnapshot(
        query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(15)),
        snap =>
          setData(prev => ({
            ...prev,
            activities: snap.docs.map(d => d.data())
          }))
      )
    ];

    return () => cleanups.forEach(u => u && u());
  }, []);

  // ───────── STATS ─────────

  const stats = useMemo(() => ({
    trees: data.trees.length,
    users: data.users.length,
    people: data.people.length,
    stories: data.stories.length,
    media: data.media.length,
    marriages: data.marriages.length
  }), [data]);

  // ───────── LANGUAGE DATA ─────────

  const languageData = useMemo(() => {
    const map = {};
    data.stories.forEach(s => {
      const l = s.language || "unknown";
      map[l] = (map[l] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    }));
  }, [data.stories]);

  // ───────── GROWTH ─────────

  const growth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      month: `M${i + 1}`,
      people: Math.floor(stats.people * ((i + 1) / 6)),
      stories: Math.floor(stats.stories * ((i + 1) / 6))
    }));
  }, [stats]);

  // ───────── UI ─────────

  return (
    <>
      {/* IMPORTANT: KEEP YOUR APP HEADER */}
      <AdminNavbar />

      <div style={{
        padding: "90px 20px 30px",
        background: "#f6f7fb",
        minHeight: "100vh"
      }}>

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2>📊 Analytics Dashboard</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Activity size={16} />
            <span style={{ fontSize: 12, color: "#666" }}>
              Live Firestore Analytics
            </span>
          </div>
        </div>

        {/* CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 20
        }}>
          <Card icon={<TreePine />} label="Trees" value={stats.trees} color="#16a34a" />
          <Card icon={<Users />} label="Users" value={stats.users} color="#2563eb" />
          <Card icon={<Users />} label="People" value={stats.people} color="#f97316" />
          <Card icon={<BookOpen />} label="Stories" value={stats.stories} color="#7c3aed" />
          <Card icon={<Image />} label="Media" value={stats.media} color="#06b6d4" />
          <Card icon={<Heart />} label="Marriages" value={stats.marriages} color="#ec4899" />
        </div>

        {/* CHARTS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 30
        }}>

          <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
            <h4>📈 Growth</h4>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growth}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="people" stroke="#16a34a" />
                <Line dataKey="stories" stroke="#7c3aed" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
            <h4>🌍 Languages</h4>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={languageData}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVITY */}
        <div style={{
          marginTop: 30,
          background: "#fff",
          padding: 16,
          borderRadius: 12
        }}>
          <h4>⚡ Recent Activity</h4>

          {data.activities.length === 0 ? (
            <p style={{ color: "#888" }}>No activity yet</p>
          ) : (
            data.activities.map((a, i) => (
              <div key={i} style={{
                padding: 10,
                borderBottom: "1px solid #eee"
              }}>
                <b>{a.activityType || "event"}</b>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {a.userName} • {
                    a.timestamp?.toDate?.()?.toLocaleString?.()
                  }
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
}