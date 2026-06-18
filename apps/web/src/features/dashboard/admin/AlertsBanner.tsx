import { Link } from 'react-router-dom';
import { useGetAlertsQuery } from '../dashboardApi';

export default function AlertsBanner({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetAlertsQuery({ academicYearId }, { 
    skip: !academicYearId,
    refetchInterval: 120000 // 2 min auto-refresh
  });

  if (isLoading) {
    return (
      <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: '99px', marginBottom: 24 }} />
    );
  }

  if (!data?.alerts?.length) return null;

  const severityMapping: Record<string, { bg: string; text: string; icon: string }> = {
    error: { bg: '#fef2f2', text: '#991b1b', icon: '🔴' },
    warning: { bg: '#fffbeb', text: '#92400e', icon: '🟡' },
    info: { bg: '#eff6ff', text: '#1e40af', icon: '🔵' },
    success: { bg: '#ecfdf5', text: '#065f46', icon: '✅' },
  };

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
      {data.alerts.map((alert: any, i: number) => {
        const colors = severityMapping[alert.severity] || severityMapping.info;
        return (
          <Link
            key={i}
            to={alert.link || '#'}
            style={{
              padding: '8px 16px',
              background: colors.bg,
              color: colors.text,
              borderRadius: '99px',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              transition: 'transform 0.2s',
              pointerEvents: alert.link ? 'auto' : 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => alert.link && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => alert.link && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>{colors.icon}</span> {alert.message}
            {alert.link && <i className="ti ti-arrow-right" style={{ opacity: 0.5, marginLeft: 4 }} />}
          </Link>
        );
      })}
    </div>
  );
}
