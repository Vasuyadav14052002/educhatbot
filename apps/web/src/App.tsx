import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';

// Lazy-loaded feature pages
import { lazy, Suspense } from 'react';
const StudentsPage = lazy(() => import('./features/students/StudentsPage'));
const StudentDetailPage = lazy(() => import('./features/students/StudentDetailPage'));
const AttendancePage = lazy(() => import('./features/attendance/AttendancePage'));
const MarksPage = lazy(() => import('./features/marks/MarksPage'));
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'));
const ClassesPage = lazy(() => import('./features/classes/ClassesPage'));
const ClassDetailPage = lazy(() => import('./features/classes/ClassDetailPage'));
const SubjectsPage = lazy(() => import('./features/subjects/SubjectsPage'));
const SubjectDetailDashboard = lazy(() => import('./features/subjects/SubjectDetailDashboard'));
const UsersPage = lazy(() => import('./features/users/UsersPage'));
const AcademicYearsPage = lazy(() => import('./features/academic-years/AcademicYearsPage'));
const AcademicYearDetailDashboard = lazy(() => import('./features/academic-years/AcademicYearDetailDashboard'));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));
const AuditLogsPage = lazy(() => import('./features/audit/AuditLogsPage'));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage'));
const ParticipationPage = lazy(() => import('./features/participation/ParticipationPage'));
const EventsPage = lazy(() => import('./features/events/EventsPage'));
const ReportsPage = lazy(() => import('./features/reports/ReportsPage'));

// Parent Portal Subpages
const ParentTimelinePage = lazy(() => import('./features/parent/ParentTimelinePage'));
const ParentMessagingPage = lazy(() => import('./features/parent/ParentMessagingPage'));
const ParentPersonalDetailsPage = lazy(() => import('./features/parent/ParentPersonalDetailsPage'));
const ParentGalleryPage = lazy(() => import('./features/parent/ParentGalleryPage'));

const PageLoader = () => (
  <div className="flex-center" style={{ height: 400 }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid var(--border-color)',
      borderTopColor: 'var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  const is_authenticated = useSelector((s: RootState) => s.auth.is_authenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          is_authenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="students" element={
              <Suspense fallback={<PageLoader />}><StudentsPage /></Suspense>
            } />
            <Route path="students/:id" element={
              <Suspense fallback={<PageLoader />}><StudentDetailPage /></Suspense>
            } />
            <Route path="attendance" element={
              <Suspense fallback={<PageLoader />}><AttendancePage /></Suspense>
            } />
            <Route path="marks" element={
              <Suspense fallback={<PageLoader />}><MarksPage /></Suspense>
            } />
            <Route path="progress" element={
              <Suspense fallback={<PageLoader />}><ProgressPage /></Suspense>
            } />
            <Route path="classes" element={
              <Suspense fallback={<PageLoader />}><ClassesPage /></Suspense>
            } />
            <Route path="classes/:classId" element={
              <Suspense fallback={<PageLoader />}><ClassDetailPage /></Suspense>
            } />
            <Route path="subjects" element={
              <Suspense fallback={<PageLoader />}><SubjectsPage /></Suspense>
            } />
            <Route path="subjects/:id" element={
              <Suspense fallback={<PageLoader />}><SubjectDetailDashboard /></Suspense>
            } />
            <Route path="users" element={
              <Suspense fallback={<PageLoader />}><UsersPage /></Suspense>
            } />
            <Route path="academic-years" element={
              <Suspense fallback={<PageLoader />}><AcademicYearsPage /></Suspense>
            } />
            <Route path="academic-years/:id" element={
              <Suspense fallback={<PageLoader />}><AcademicYearDetailDashboard /></Suspense>
            } />
            <Route path="notifications" element={
              <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>
            } />
            <Route path="audit-logs" element={
              <Suspense fallback={<PageLoader />}><AuditLogsPage /></Suspense>
            } />
            <Route path="analytics" element={
              <Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>
            } />
            <Route path="participation" element={
              <Suspense fallback={<PageLoader />}><ParticipationPage /></Suspense>
            } />
            <Route path="events" element={
              <Suspense fallback={<PageLoader />}><EventsPage /></Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>
            } />
            
            {/* Parent-Only Routes */}
            <Route path="timeline" element={
              <Suspense fallback={<PageLoader />}><ParentTimelinePage /></Suspense>
            } />
            <Route path="messages" element={
              <Suspense fallback={<PageLoader />}><ParentMessagingPage /></Suspense>
            } />
            <Route path="profile" element={
              <Suspense fallback={<PageLoader />}><ParentPersonalDetailsPage /></Suspense>
            } />
            <Route path="gallery" element={
              <Suspense fallback={<PageLoader />}><ParentGalleryPage /></Suspense>
            } />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
