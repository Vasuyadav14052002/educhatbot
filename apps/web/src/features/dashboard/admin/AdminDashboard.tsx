import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../../store';
import { useGetAcademicYearsQuery } from '../../academic-years/academicYearsApi';
import AlertsBanner from './AlertsBanner';
import KpiRow from './KpiRow';
import KpiRowSecondary from './KpiRowSecondary';
import KeyInsightsStrip from './KeyInsightsStrip';
import QuickActionsGrid from './QuickActionsGrid';
import ClassPerformanceTable from './ClassPerformanceTable';
import AttendanceTrendChart from './AttendanceTrendChart';
import SubjectPerformanceChart from './SubjectPerformanceChart';
import AttendanceDonutChart from './AttendanceDonutChart';
import FeeCollectionChart from './FeeCollectionChart';
import RecentActivityFeed from './RecentActivityFeed';
import UpcomingEventsWidget from './UpcomingEventsWidget';
import ExportReportDropdown from './ExportReportDropdown';

export default function AdminDashboard() {
  const user = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');

  // Auto-refresh timer and last updated display
  useEffect(() => {
    const timeAgoInterval = setInterval(() => {
      const diffMinutes = Math.floor((new Date().getTime() - lastRefreshed.getTime()) / 60000);
      if (diffMinutes === 0) setTimeAgo('just now');
      else if (diffMinutes === 1) setTimeAgo('1 min ago');
      else setTimeAgo(`${diffMinutes} mins ago`);
    }, 60000);

    return () => {
      clearInterval(timeAgoInterval);
    };
  }, [lastRefreshed]);

  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Fetch academic years to find the active one
  const { data: yearsData, isLoading: isYearsLoading } = useGetAcademicYearsQuery();
  
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  // Get active year ID
  const activeYear = yearsData?.find((y: any) => y.is_current) || yearsData?.[0];
  const activeYearId = activeYear?.id || '';

  if (isYearsLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* 1. Header Bar */}
      <div className="page-header" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            {greeting}, {user?.first_name}! 👋
          </h1>
          <p className="page-subtitle">
            {activeYear?.name ? `Term: ${activeYear.name} • ` : ''}Here's what's happening at your school today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Last updated {timeAgo}</span>
            <button 
              onClick={handleManualRefresh}
              className="btn btn-ghost btn-icon" 
              style={{ width: 28, height: 28, padding: 0 }}
              title="Refresh Dashboard"
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportReportDropdown />
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/students/new')}>
              + Add Student
            </button>
          </div>
        </div>
      </div>

      {/* 2. Alerts Banner */}
      <AlertsBanner academicYearId={activeYearId} />

      {/* 3. Primary KPI Row */}
      <KpiRow academicYearId={activeYearId} />

      {/* 4. Secondary KPI Row */}
      <KpiRowSecondary academicYearId={activeYearId} />

      {/* 5. Key Insights Strip */}
      <KeyInsightsStrip academicYearId={activeYearId} />

      {/* 6. Quick Actions Grid */}
      <QuickActionsGrid />

      {/* 7. Class Performance Table (Above charts) */}
      <ClassPerformanceTable academicYearId={activeYearId} />

      {/* 8. Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <AttendanceTrendChart />
        <SubjectPerformanceChart academicYearId={activeYearId} />
      </div>

      {/* 9. Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <AttendanceDonutChart />
        <RecentActivityFeed />
      </div>

      {/* 10. Charts Row 3 */}
      <div className="grid-2">
        <FeeCollectionChart />
        <UpcomingEventsWidget academicYearId={activeYearId} />
      </div>
    </div>
  );
}
