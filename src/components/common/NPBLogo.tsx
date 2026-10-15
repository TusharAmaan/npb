import React from 'react';

export const NPBLogo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="npbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7158e2" />
        <stop offset="50%" stopColor="#7d5fff" />
        <stop offset="100%" stopColor="#17c0eb" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#npbGrad)" />
    {/* Minimalist Open Book + Rising Performance Bar Monogram */}
    <path
      d="M16 44V20L27 36V20M34 44V20H42C45.3137 20 48 22.6863 48 26C48 29.3137 45.3137 32 42 32H34"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="45" cy="41" r="3.5" fill="#32ff7e" />
  </svg>
);
