import { useGetRecentActivityQuery } from '../dashboardApi';
import { Link } from 'react-router-dom';

export default function RecentActivityFeed() {
  const { data, isLoading } = useGetRecentActivityQuery({ limit: 8 });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">⚡ Recent Activity</span>
        <Link to="/activity-log" className="btn btn-ghost btn-sm">View all</Link>
      </div>
      <div className="card-body" style={{ padding: '8px 0' }}>
        {isLoading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (data?.activities?.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-activity" style={{ fontSize: 32, color: 'var(--color-text-secondary)', opacity: 0.5 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>No recent activity</div>
            <Link to={`/attendance?date=today`} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
              Mark Attendance
            </Link>
          </div>
        ) : (
          data?.activities?.map((activity: any, i: number) => {
            let icon = '⚡';
            let bg = 'var(--bg-secondary)';
            if (activity.type === 'Attendance') { icon = '📋'; bg = 'var(--color-secondary-surface)'; }
            else if (activity.type === 'Mark') { icon = '📝'; bg = 'var(--color-primary-surface)'; }
            else if (activity.type === 'Student') { icon = '👨‍🎓'; bg = 'var(--color-warning-surface)'; }
            else if (activity.type === 'Fee') { icon = '💳'; bg = 'var(--color-success-surface)'; }

            const timeStr = new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <Link
                key={activity.id}
                to={activity.link || '#'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 24px',
                  borderBottom: i < data.activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)', background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {activity.description}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    By {activity.actor}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {timeStr}
                </div>
              </Link>
            );
          })
        ))}
      </div>
    </div>
  );
}
