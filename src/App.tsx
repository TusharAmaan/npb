import React, { useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ModalProvider } from './context/ModalContext';

// Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { HomeLandingView } from './components/home/HomeLandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { BatchList } from './components/batches/BatchList';
import { StudentDirectory } from './components/students/StudentDirectory';
import { LiveClassSession } from './components/live-class/LiveClassSession';
import { HomeworkManager } from './components/homework/HomeworkManager';
import { ExamManager } from './components/exams/ExamManager';
import { WeakTopicRadar } from './components/tutor-tools/WeakTopicRadar';
import { MakeupPlanner } from './components/tutor-tools/MakeupPlanner';
import { LectureSheetTracker } from './components/tutor-tools/LectureSheetTracker';
import { AdminLeaderboardControl } from './components/leaderboard/AdminLeaderboardControl';
import { PublicLeaderboardView } from './components/leaderboard/PublicLeaderboardView';
import { GuardianReportView } from './components/reports/GuardianReportView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminLogin } from './components/auth/AdminLogin';

// Admin Layout Shell
const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-base">
        <div className="w-8 h-8 border-4 border-light-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, prompt to log in
  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 w-full max-w-full overflow-hidden">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ModalProvider>
            <Router>
              <Routes>
                {/* Public Dedicated Homepage */}
                <Route path="/" element={<HomeLandingView />} />

                {/* Public Portals */}
                <Route path="/leaderboard" element={<PublicLeaderboardView />} />
                <Route path="/report/:shareToken" element={<GuardianReportView />} />
                <Route path="/login" element={<AdminLogin />} />

                {/* Admin Protected Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardView />} />
                  <Route path="live-class" element={<LiveClassSession />} />
                  <Route path="batches" element={<BatchList />} />
                  <Route path="students" element={<StudentDirectory />} />
                  <Route path="homework" element={<HomeworkManager />} />
                  <Route path="exams" element={<ExamManager />} />
                  {/* Tutor Tools */}
                  <Route path="tools" element={<WeakTopicRadar />} />
                  <Route path="tools/weak-topics" element={<WeakTopicRadar />} />
                  <Route path="tools/makeup" element={<MakeupPlanner />} />
                  <Route path="tools/sheets" element={<LectureSheetTracker />} />
                  <Route path="leaderboard-settings" element={<AdminLeaderboardControl />} />
                  <Route path="settings" element={<SettingsView />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<HomeLandingView />} />
              </Routes>
            </Router>
          </ModalProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
