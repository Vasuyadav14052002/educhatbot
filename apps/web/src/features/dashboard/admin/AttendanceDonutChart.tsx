import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useGetTodayAttendanceBreakdownQuery } from '../dashboardApi';
import { Link } from 'react-router-dom';

export default function AttendanceDonutChart() {
  const { data, isLoading } = useGetTodayAttendanceBreakdownQuery();

  const chartData = [
    { name: 'Present', value: data?.present || 0, color: '#10B981' },
    { name: 'Absent', value: data?.absent || 0, color: '#F43F5E' },
    { name: 'Late', value: data?.late || 0, color: '#F59E0B' },
    { name: 'Leave', value: data?.leave || 0, color: '#94A3B8' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🗂️ Today's Attendance Breakdown</span>
      </div>
      <div className="card-body" style={{ padding: '16px' }}>
        {isLoading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (!data || data.total === 0) ? (
          <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-chart-pie" style={{ fontSize: 32, color: 'var(--color-text-secondary)', opacity: 0.5 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Attendance not marked yet today</div>
            <Link to="/attendance?date=today" className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
              Mark Now &rarr;
            </Link>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', height: 200, marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => {
                      const perc = data?.total > 0 ? Math.round((v / data.total) * 100) : 0;
                      return [`${v} (${perc}%)`, name];
                    }}
                    contentStyle={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v, entry: any) => (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {v}: <span style={{ fontWeight: 600 }}>{entry.payload.value}</span>
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 20, // offset legend
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{data?.total || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Students</div>
              </div>
            </div>

            {/* Class Breakdown Table */}
            {data?.classBreakdown?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <table className="table" style={{ fontSize: 13, margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 4px' }}>Class</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Present</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Absent</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Late</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.classBreakdown?.slice(0, 4).map((c: any, i: number) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 4px', fontWeight: 500 }}>{c.className}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', color: '#10B981' }}>{c.present}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', color: '#F43F5E' }}>{c.absent}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', color: '#F59E0B' }}>{c.late}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                          <Link to={`/attendance?class=${c.className}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
