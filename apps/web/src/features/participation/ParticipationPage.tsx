import { useState, useMemo } from 'react';
import { 
  Trophy, Medal, Target, Users, Activity, Star, Filter, Download, 
  Plus, Search
} from 'lucide-react';
import { 
  useGetParticipationOverviewQuery, 
  useGetParticipationAnalyticsQuery, 
  useGetParticipationRecordsQuery, 
  useGetAchievementsQuery, 
  useGetBadgesQuery 
} from './participationApi';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './participation.css';

const THEME_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ParticipationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch Data
  const { data: overview, isLoading: isOverviewLoading } = useGetParticipationOverviewQuery();
  const { data: analytics } = useGetParticipationAnalyticsQuery();
  const { data: records, isLoading: isRecordsLoading } = useGetParticipationRecordsQuery();
  const { data: achievements } = useGetAchievementsQuery();
  const { data: badges } = useGetBadgesQuery();

  // Table Setup
  const [globalFilter, setGlobalFilter] = useState('');
  
  const columns = useMemo(() => [
    { accessorKey: 'student.student_code', header: 'Student ID' },
    { 
      id: 'studentName', 
      header: 'Student Name',
      accessorFn: (row: any) => `${row.student?.first_name} ${row.student?.last_name}`
    },
    { accessorKey: 'activity_type', header: 'Activity Type' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'level', header: 'Level', cell: (info: any) => info.getValue() || '-' },
    { accessorKey: 'date', header: 'Date', cell: (info: any) => new Date(info.getValue()).toLocaleDateString() },
    { accessorKey: 'points', header: 'Points' },
    { 
      id: 'teacher', 
      header: 'Teacher',
      accessorFn: (row: any) => `${row.recorder?.first_name} ${row.recorder?.last_name}`
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: (info: any) => (
        <span className={`status-badge ${info.getValue().toLowerCase()}`}>
          {info.getValue()}
        </span>
      )
    },
  ], []);

  const table = useReactTable({
    data: records || [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isOverviewLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading Activity Data...</div>;
  }

  return (
    <div className="participation-dashboard">
      <div className="page-header-split">
        <div>
          <h1 className="page-title">Participation & Extracurriculars</h1>
          <p className="page-subtitle" style={{ marginTop: 8 }}>Track student involvement, achievements, leadership, and cultural participation.</p>
        </div>
        <div className="p-header-actions">
          <button className="btn-outline"><Download size={18}/> Export Report</button>
          <button className="btn-premium"><Plus size={18}/> Add Record</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper"><Users /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Participants</div>
            <div className="kpi-value">{overview?.activeParticipants} / {overview?.totalStudents}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Activity /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Activities</div>
            <div className="kpi-value">{overview?.totalActivities || 0}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Trophy /></div>
          <div className="kpi-content">
            <div className="kpi-label">Achievements Earned</div>
            <div className="kpi-value">{overview?.achievementsEarned || 0}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><Medal /></div>
          <div className="kpi-content">
            <div className="kpi-label">Badges Awarded</div>
            <div className="kpi-value">{overview?.badgesAwarded || 0}</div>
          </div>
        </div>
      </div>

      <div className="participation-tabs">
        <button className={`p-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Target size={18}/> Analytics Overview</button>
        <button className={`p-tab ${activeTab === 'spreadsheet' ? 'active' : ''}`} onClick={() => setActiveTab('spreadsheet')}><Activity size={18}/> Spreadsheet View</button>
        <button className={`p-tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}><Trophy size={18}/> Achievements Gallery</button>
        <button className={`p-tab ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}><Star size={18}/> Badges</button>
      </div>

      {activeTab === 'overview' && (
        <div className="chart-grid">
          <div className="chart-container">
            <div className="chart-title">Activity Category Distribution</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categoryDistribution || []}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(analytics?.categoryDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-title">Monthly Participation Trend</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spreadsheet' && (
        <div className="spreadsheet-container">
          <div className="spreadsheet-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Quick search students or activities..." 
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline"><Filter size={16}/> Filter</button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="tanstack-table">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} onClick={header.column.getToggleSortingHandler()} style={{ cursor: 'pointer' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {isRecordsLoading ? 'Loading records...' : 'No participation records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: '#fafafa' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {table.getRowModel().rows.length} of {records?.length || 0} records
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => table.previousPage()} 
                disabled={!table.getCanPreviousPage()}
                className="btn-outline" style={{ padding: '6px 12px' }}>Prev</button>
              <button 
                onClick={() => table.nextPage()} 
                disabled={!table.getCanNextPage()}
                className="btn-outline" style={{ padding: '6px 12px' }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="gallery-grid">
          {(achievements || []).map((ach: any) => (
            <div key={ach.id} className="achievement-card">
              <div className="ac-icon">🏆</div>
              <div className="ac-title">{ach.title}</div>
              <div className="ac-desc">{ach.description}</div>
              <div className="ac-meta">
                <span>{ach.student?.first_name} {ach.student?.last_name}</span>
                <span>{new Date(ach.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {(achievements?.length === 0) && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              No achievements recorded yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="gallery-grid">
          {(badges || []).map((badge: any) => (
            <div key={badge.id} className="achievement-card">
              <div className="ac-icon">{badge.badge_icon || '⭐'}</div>
              <div className="ac-title">{badge.badge_name}</div>
              <div className="ac-desc">{badge.description}</div>
              <div className="ac-meta" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
                <span>{badge.student?.first_name} {badge.student?.last_name}</span>
                <span style={{ fontWeight: 800 }}>+{badge.points} pts</span>
              </div>
            </div>
          ))}
          {(badges?.length === 0) && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              No badges awarded yet.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
