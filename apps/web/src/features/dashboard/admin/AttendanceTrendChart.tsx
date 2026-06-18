import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useGetDashboardAttendanceTrendQuery } from '../dashboardApi';

export default function AttendanceTrendChart() {
  const [range, setRange] = useState('6months');
  const { data, isLoading } = useGetDashboardAttendanceTrendQuery({ range });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📈 Attendance Trend</span>
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: 13, padding: '4px 8px' }}
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="6months">Last 6 months</option>
          <option value="3months">Last 3 months</option>
          <option value="12months">Last 12 months</option>
        </select>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {isLoading ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (!data?.hasEnoughData) ? (
          <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <i className="ti ti-chart-area-line" style={{ fontSize: 32, color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: 12 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{data?.dataQualityNote || 'Not enough data yet. Check back after 30 days.'}</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.months || []}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  fontSize: 13,
                }}
                formatter={(v: number, name: string, props: any) => [`${v}% (${props.payload.count} records)`, 'Attendance']}
              />
              <ReferenceLine y={85} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target 85%', fill: '#10B981', fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fill="url(#attendanceGrad)"
                dot={{ fill: '#4F46E5', r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
