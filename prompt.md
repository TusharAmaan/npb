# PROJECT SPECIFICATION: NPB — Student, Batch & Academic Performance Management System

## 1. ROLE & OBJECTIVE
You are a Principal Full-Stack Engineer and UI/UX Architect. Build a complete, production-ready, offline-capable web application named **NPB** for English tutor **Abdullah All Masum**. 

Do not leave placeholder stubs or `TODO` comments. Implement full CRUD workflows, calculation engines, Firestore real-time synchronization with offline persistence, responsive mobile-first in-class controls, rich desktop analytics, an admin-controlled Public Leaderboard, and a 3-mode Guardian Report System.

**STRICT DOMAIN RULE:** There must be **ZERO monetary, fee, tuition, or payment tracking** anywhere in the database, UI, or reports. The platform is 100% dedicated to academic tracking, syllabi, attendance, homework, exams, lecture sheets, and student performance.

---

## 2. BRANDING & IDENTITY (HARDCODED DEFAULTS + ADMIN EDITABLE)
- **Platform Name:** `NPB`
- **Tutor Name:** `Abdullah All Masum`
- **Tagline:** None (Do not render any subtitle/tagline).
- **WhatsApp / Contact Number:** `01619663933` (Include click-to-chat `https://wa.me/8801619663933` links where appropriate on reports/headers).
- **Brand Logo Component (`src/components/common/NPBLogo.tsx`):**
  Create a reusable, crisp, modern minimal SVG React component that accepts `size` and `className` props:
  ```tsx
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
  ```

---

## 3. TECH STACK & FIREBASE INFRASTRUCTURE
* **Framework:** React 18+ with Vite and TypeScript (`strict: true`).
* **Styling:** Tailwind CSS + CSS Variables for Light/Dark Mode theming.
* **Icons:** `lucide-react`.
* **Charts & Visualizations:** `recharts` (Radar charts for Weak Topics, Area/Line charts for Exam Trends, Bar charts for Section Breakdowns, Radial progress bars for Syllabus/Attendance).
* **PDF & Image Export:** `html2canvas` + `jspdf` for clean 1-click Guardian Report Card PDF downloads.
* **Routing:** `react-router-dom` v6.
* **Backend & Hosting:** Firebase Modular SDK v10/v11 (`firebase/app`, `firebase/auth`, `firebase/firestore`).
* **Firebase Project Details:**
  * **Project Name:** `BatchMgt`
  * **Project ID:** `batchmgt-6f7ad`
  * **Project Number:** `116589525906`
  * **Environment:** `Production`
* **Firestore Offline Persistence:** MUST enable `initializeFirestore` with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` so that if mobile internet drops inside a classroom, the tutor can mark attendance, homework, and lessons seamlessly and have it sync automatically once reconnected.

---

## 4. DESIGN SYSTEM & COLOR PALETTE (TURKISH FLAT UI PALETTE)
Configure Tailwind CSS (`tailwind.config.js`) and CSS variables using these exact hex values from the Turkish Palette:

### Core Palette Tokens
* **Primary Brand / Indigo:**
  * `light-indigo`: `#7158e2` (Primary buttons, active navigation, key accents)
  * `light-slate-blue`: `#7d5fff` (Hover states, gradients, primary highlights)
* **Secondary / Cyan & Electric Accents:**
  * `spiro-disco-ball`: `#17c0eb` (Info badges, secondary charts, links)
  * `neon-blue`: `#18dcff` (Active rings, streak indicators)
  * `hammam-blue`: `#67e6dc` (Teal tags, lecture sheet badges)
  * `electric-blue`: `#7efff5` (Subtle cyan highlights in dark mode)
* **Purple / Course & Syllabus Accents:**
  * `bright-lilac`: `#cd84f1` (Syllabus category pills)
  * `light-purple`: `#c56cf0` (Bonus points, top rank badges)
* **Success / Attendance Present & Mastery:**
  * `weird-green`: `#3ae374` (Present status, Homework Done, High exam scores >=80%)
  * `wintergreen`: `#32ff7e` (Active live indicator, 100% completion highlight)
* **Warning / Late, Partial & Revision Needed:**
  * `radiant-yellow`: `#ff9f1a` (Late status, Partial homework, Revision Needed)
  * `mandarin-sorbet`: `#ffaf40` (Pending makeup alerts, moderate scores 60–79%)
  * `dorn-yellow`: `#fff200` / `unmellow-yellow`: `#fffa65` (Gold Crown #1 Leaderboard accents)
* **Danger / Absent, Weak Topic & Missed Work:**
  * `light-red`: `#ff4d4d` (Absent status, Homework Not Done, Weak Topic <60%)
  * `red-orange`: `#ff3838` (Critical alerts, overdue makeup)
  * `young-salmon`: `#ffb8b8` / `pretty-please`: `#ffcccc` (Soft danger backgrounds in light mode)
* **Dark Neutrals & Surfaces:**
  * `baltic-sea`: `#3d3d3d` (Dark mode card surface / primary dark text in light mode)
  * `shadowed-steel`: `#4b4b4b` (Dark mode secondary surface / borders)

### Theme Support (Light & Dark Mode Toggle)
* Provide a persistent Light/Dark mode switch in the top navbar.
* **Light Mode:** Clean slate-white background (`#f8fafc`), crisp white cards (`#ffffff`), `#3d3d3d` (`baltic-sea`) typography, and vibrant Turkish palette status pills.
* **Dark Mode:** Deep charcoal base (`#1e1e24`), elevated surfaces in `#2b2b36` and `#3d3d3d` (`baltic-sea`), borders in `#4b4b4b` (`shadowed-steel`), and glowing Turkish neon accents.

---

## 5. ACCESS TIERS & APPLICATION ROUTES
1. **Admin Portal (`/admin/*`):**
   * Protected by Firebase Authentication (Email/Password + Google Sign-In with admin email whitelist).
   * Full mobile bottom-navigation bar (for fast one-handed classroom operation) + collapsible desktop sidebar.
2. **Public Leaderboard Portal (`/leaderboard`):**
   * Publicly accessible without login.
   * Displays batch-wise rankings filtered by **Batch**, **Month**, **Term/Course**, or **All-Time**.
   * **100% Controlled by Admin Visibility Settings:** Only renders batches and columns explicitly enabled by the Admin. Uses the student's manual `publicRollNo` field so student privacy or custom ordering is strictly respected.
3. **Guardian Live Report Portal (`/report/:shareToken`):**
   * Public secret-link view accessible by parents via WhatsApp link without logging in.
   * Renders only the specific student's live academic report card, attendance calendar, syllabus progress, weak topic radar, homework record, and section-wise exam performance.

---

## 6. COMPLETE FIRESTORE DATA MODEL (`src/types/models.ts`)
(Specified in detail in prompt)

---

## 7. DETAILED MODULE & WORKFLOW REQUIREMENTS
- MODULE 1: Smart Home Dashboard & Weekly Routine Engine
- MODULE 2: Individual Student Syllabus Engine (Fast Bulk Input + Clone)
- MODULE 3: Mobile-First "Live Class Mode" (Attendance + Lessons + Sheet Alerts)
- MODULE 4: Dual-Mode Homework Tracker
- MODULE 5: Advanced Exam & Section-Wise Analytics
- MODULE 6: English-Tutor Power Tools (Makeup Planner, Weak Radar & Sheet Tracker)
- MODULE 7: Dynamic Performance Math & Admin-Controlled Public Leaderboard
- MODULE 8: High-Architecture Guardian Report Engine (3-in-1 System)
- MODULE 9: Data Safety, CSV Import & JSON Backup