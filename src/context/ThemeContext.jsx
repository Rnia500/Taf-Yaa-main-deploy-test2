// src/context/ThemeContext.jsx
// Taf'Yaa — Global Dark Mode Theme Context

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    // Check saved preference or system preference
    const saved = localStorage.getItem('tafyaa-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('tafyaa-theme', dark ? 'dark' : 'light');
    // Apply to document root for CSS variables
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.style.background = dark ? '#111827' : '#f8fafc';
  }, [dark]);

  const toggle = () => setDark(d => !d);

  // Color tokens
  const theme = {
    dark,
    toggle,
    // Backgrounds
    bg:        dark ? '#111827' : '#f8fafc',
    card:      dark ? '#1f2937' : '#ffffff',
    cardHover: dark ? '#374151' : '#f9fafb',
    sidebar:   dark ? '#1f2937' : '#ffffff',
    input:     dark ? '#374151' : '#f9fafb',
    // Borders
    border:    dark ? '#374151' : '#f0f0f0',
    borderFocus: '#16a34a',
    // Text
    text:      dark ? '#f9fafb' : '#111827',
    textSub:   dark ? '#d1d5db' : '#374151',
    textMuted: dark ? '#9ca3af' : '#6b7280',
    textFaint: dark ? '#6b7280' : '#9ca3af',
    // Brand
    primary:   '#16a34a',
    primaryBg: dark ? '#064e3b' : '#f0fdf4',
    primaryBorder: dark ? '#065f46' : '#bbf7d0',
    // Status
    success:   '#16a34a',
    error:     '#dc2626',
    warning:   '#d97706',
    info:      '#2563eb',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};