import { useSelector } from 'react-redux';
import { useGetTeacherKPIsQuery } from '../analytics/analyticsApi';
import type { RootState } from '../../store';

export default function TeacherDashboard() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: kpis, isLoading } = useGetTeacherKPIsQuery();

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      label: 'My Students',
      value: isLoading ? '—' : (kpis?.total_students ?? 0).toString(),
      icon: '👨‍🎓',
      color: 'primary',
      change: 'Across all classes',
      changeDir: 'up',
    },
    {
      label: 'Pending Evaluations',
      value: isLoading ? '—' : (kpis?.pending_evaluations ?? 0).toString(),
      icon: '📝',
      color: 'warning',
      change: 'Requires attention',
      changeDir: 'down',
    },
    {
      label: 'Students at Risk',
      value: isLoading ? '—' : (kpis?.students_at_risk?.length ?? 0).toString(),
      icon: '⚠️',
      color: 'danger',
      change: 'Low attendance/marks',
      changeDir: 'down',
    },
    {
      label: 'Attendance Marked',
      value: isLoading ? '—' : kpis?.today_marked_attendance ? 'Yes' : 'No',
      icon: '📋',
      color: kpis?.today_marked_attendance ? 'success' : 'danger',
      change: 'For today',
      changeDir: kpis?.today_marked_attendance ? 'up' : 'down',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {user?.first_name}! 👋</h1>
          <p className="page-subtitle">Here's your classroom overview for today.</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">
                  {isLoading ? <span className="skeleton" style={{ width: 80, height: 36, display: 'block' }} /> : stat.value}
                </div>
              </div>
              <div className={`stat-card-icon ${stat.color}`} style={{ fontSize: 24 }}>
                {stat.icon}
              </div>
            </div>
            <div className={`stat-card-change ${stat.changeDir}`}>
              {stat.changeDir === 'up' ? '↑' : '↓'} {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Students at Risk</span>
          </div>
          <div className="card-body">
            {kpis?.students_at_risk?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No students currently at risk.</p>
            ) : (
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Risk Factor</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis?.students_at_risk?.map((risk: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 0' }}>{risk.student?.full_name}</td>
                      <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{risk.risk_factors.join(', ')}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span className={`badge badge-${risk.risk_level === 'HIGH' ? 'danger' : 'warning'}`}>
                          {risk.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
