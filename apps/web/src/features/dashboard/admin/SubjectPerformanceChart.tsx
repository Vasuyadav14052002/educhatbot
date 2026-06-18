import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useGetSubjectPerformanceQuery } from '../dashboardApi';
import { useNavigate } from 'react-router-dom';

export default function SubjectPerformanceChart({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetSubjectPerformanceQuery({ academicYearId }, { skip: !academicYearId });
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📚 Subject Performance</span>
        <span className="badge badge-primary">Current Term</span>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {isLoading ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (!data?.subjects || data.subjects.every((s: any) => s.avgScore === 0)) ? (
          <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <i className="ti ti-books" style={{ fontSize: 32, color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: 12 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>No marks uploaded this term yet.</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.subjects?.filter((s: any) => s.avgScore > 0) || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-color)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  fontSize: 13,
                }}
                formatter={(v: number, name: string, props: any) => [`${v}% (Pass: ${props.payload.passRate}%)`, 'Average']}
              />
              <Bar 
                dataKey="avgScore" 
                radius={[0, 6, 6, 0]}
                label={{ position: 'right', fill: 'var(--text-primary)', fontSize: 12, formatter: (v: number) => `${v}%` }}
                onClick={(data) => {
                  if (data) navigate(`/subjects`);
                }}
                style={{ cursor: 'pointer' }}
              >
                {(data?.subjects?.filter((s: any) => s.avgScore > 0) || []).map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={['#4F46E5', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6'][i % 5]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
