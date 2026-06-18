import { useGetInsightsQuery } from '../dashboardApi';
import InsightCard, { InsightCardProps } from './InsightCard';

export default function KeyInsightsStrip({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetInsightsQuery({ academicYearId }, { 
    skip: !academicYearId,
    refetchInterval: 180000 // 3 min
  });

  if (isLoading) {
    return (
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Key Insights</h3>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ minWidth: 280, height: 120, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.insights || data.insights.length === 0) {
    return null; // Don't show if empty
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="ti ti-bulb" style={{ color: 'var(--color-primary)' }} />
        Key Insights
      </h3>
      <div 
        style={{ 
          display: 'flex', 
          gap: 16, 
          overflowX: 'auto', 
          paddingBottom: 16,
          scrollbarWidth: 'thin', // Firefox
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {data.insights.map((insight: InsightCardProps & { id: string }) => (
          <InsightCard key={insight.id} {...insight} />
        ))}
      </div>
    </div>
  );
}
