import { useGetUpcomingEventsQuery } from '../dashboardApi';
import { Link } from 'react-router-dom';

export default function UpcomingEventsWidget({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetUpcomingEventsQuery({ limit: 4 });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📅 Upcoming Events</span>
        <Link to={`/academic-years/${academicYearId}?section=calendar`} className="btn btn-ghost btn-sm">Full Calendar</Link>
      </div>
      <div className="card-body" style={{ padding: '8px 0' }}>
        {isLoading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (data?.events?.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 32, color: 'var(--color-text-secondary)', opacity: 0.5 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>No upcoming events scheduled</div>
            <Link to={`/academic-years/${academicYearId}?section=calendar`} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
              + Schedule Event
            </Link>
          </div>
        ) : (
          data?.events?.map((event: any, i: number) => {
            const dateObj = new Date(event.date);
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = dateObj.getDate();

            let color = 'var(--color-primary)';
            let bg = 'var(--color-primary-surface)';
            if (event.type === 'HOLIDAY') { color = '#10B981'; bg = '#ecfdf5'; }
            else if (event.type === 'EXAM') { color = '#F43F5E'; bg = '#fff1f2'; }

            return (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 24px',
                  borderBottom: i < data.events.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color: color,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{month}</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{day}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {event.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 4, color: 'var(--text-secondary)' }}>
                      {event.type}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: event.daysUntil === 'Today' ? '#F43F5E' : 'var(--text-muted)' }}>
                  {event.daysUntil}
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}
