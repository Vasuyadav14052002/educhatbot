import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetClassDetailsQuery } from './classesApi';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Users, Award, Calendar, AlertTriangle, Search, Filter,
  ArrowUpDown, Grid, List, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  // Directory states
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Query live DB class metrics
  const { data, isLoading } = useGetClassDetailsQuery({
    grade: classId || '8',
    search,
    section,
    page,
    limit: 10,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const kpis = data?.kpis || { total_students: 0, boys: 0, girls: 0, attendance_rate: 0, avg_marks: 0, top_performer: 'N/A', at_risk_count: 0 };
  const students = data?.students?.data || [];
  const meta = data?.students?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 };
  const analytics = data?.analytics || { attendance_trend: [], marks_trend: [], subject_performance: [], behavior_score: 90, participation_score: 90, top_performers: [], at_risk: [] };

  const handleStudentClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const THEME_COLORS = {
    primary: '#4F46E5',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#F43F5E',
    info: '#06B6D4',
  };

  return (
    <div className="class-detail-container">
      {/* Page Header */}
      <div className="page-header card border-glow" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/classes')} style={{ marginBottom: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={16} /> Back to Classes
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>Class {classId} Dashboard</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Roster directory, performance trends, and student diagnostics.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}/>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading class details...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {/* Total Students */}
            <div className="stat-card primary">
              <div className="stat-card-header">
                <div>
                  <div className="stat-card-label">Total Students</div>
                  <div className="stat-card-value">{kpis.total_students}</div>
                </div>
                <div className="stat-card-icon primary"><Users size={20} /></div>
              </div>
              <div className="stat-card-change up">
                <span>{kpis.boys} Boys · {kpis.girls} Girls</span>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="stat-card success">
              <div className="stat-card-header">
                <div>
                  <div className="stat-card-label">Average Attendance</div>
                  <div className="stat-card-value">{kpis.attendance_rate}%</div>
                </div>
                <div className="stat-card-icon success"><Calendar size={20} /></div>
              </div>
              <div className="stat-card-change up">
                <span>Consolidated across sections</span>
              </div>
            </div>

            {/* Average Marks */}
            <div className="stat-card warning">
              <div className="stat-card-header">
                <div>
                  <div className="stat-card-label">Average Marks</div>
                  <div className="stat-card-value">{kpis.avg_marks}%</div>
                </div>
                <div className="stat-card-icon warning"><Award size={20} /></div>
              </div>
              <div className="stat-card-change up">
                <span>Top performer: {kpis.top_performer}</span>
              </div>
            </div>

            {/* Students at Risk */}
            <div className="stat-card danger">
              <div className="stat-card-header">
                <div>
                  <div className="stat-card-label">Students at Risk</div>
                  <div className="stat-card-value">{kpis.at_risk_count}</div>
                </div>
                <div className="stat-card-icon danger"><AlertTriangle size={20} /></div>
              </div>
              <div className="stat-card-change down">
                <span>Requires academic/attendance checks</span>
              </div>
            </div>
          </div>

          {/* Student Directory & Search controls */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <span className="card-title">👨‍🎓 Student Directory</span>
              
              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* Search */}
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px 10px', width: 220 }}>
                  <Search size={14} className="text-muted" style={{ marginRight: 6 }} />
                  <input
                    type="text"
                    placeholder="Search name, code..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%', outline: 'none' }}
                  />
                </div>

                {/* Section Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={14} className="text-muted" />
                  <select
                    className="form-select"
                    value={section}
                    onChange={(e) => { setSection(e.target.value); setPage(1); }}
                    style={{ padding: '4px 10px', fontSize: 13, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>

                {/* Grid/List View Toggles */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{ background: viewMode === 'grid' ? 'var(--bg-primary)' : 'none', border: 'none', padding: 4, borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{ background: viewMode === 'list' ? 'var(--bg-primary)' : 'none', border: 'none', padding: 4, borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body" style={{ padding: viewMode === 'list' ? 0 : 20 }}>
              {students.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No students match the criteria in Class {classId}.</div>
              ) : viewMode === 'list' ? (
                /* List View */
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSortToggle('name')} style={{ cursor: 'pointer' }}>
                          Name <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                        </th>
                        <th>Student ID</th>
                        <th onClick={() => handleSortToggle('roll_number')} style={{ cursor: 'pointer' }}>
                          Roll Number <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                        </th>
                        <th>Section</th>
                        <th onClick={() => handleSortToggle('attendance_rate')} style={{ cursor: 'pointer' }}>
                          Attendance % <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                        </th>
                        <th onClick={() => handleSortToggle('average_marks')} style={{ cursor: 'pointer' }}>
                          Average Marks <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s: any) => (
                        <tr key={s.id} onClick={() => handleStudentClick(s.id)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img src={s.photo_url} alt={s.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                              <span style={{ fontWeight: 600 }}>{s.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{s.student_code}</td>
                          <td>#{s.roll_number}</td>
                          <td><span className="badge badge-secondary">Section {s.section}</span></td>
                          <td>
                            <span className={s.attendance_rate < 75 ? 'text-danger font-semibold' : 'font-medium'}>
                              {s.attendance_rate}%
                            </span>
                          </td>
                          <td>
                            <span className={s.average_marks < 50 ? 'text-danger font-semibold' : 'font-medium'}>
                              {s.average_marks}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {students.map((s: any) => (
                    <div
                      key={s.id}
                      className="card student-directory-card border-glow"
                      onClick={() => handleStudentClick(s.id)}
                      style={{ cursor: 'pointer', transition: 'var(--transition-base)' }}
                    >
                      <div className="card-body flex-col-center" style={{ padding: 16 }}>
                        <img src={s.photo_url} alt={s.name} style={{ width: 56, height: 56, borderRadius: '50%', marginBottom: 12, border: '2px solid var(--border-color)' }} />
                        <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)' }}>{s.name}</h4>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{s.student_code} · Roll #{s.roll_number}</div>
                        
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <span className="badge badge-secondary">Sec {s.section}</span>
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4, fontSize: 12 }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</div>
                            <span style={{ fontWeight: 600, color: s.attendance_rate < 75 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{s.attendance_rate}%</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Marks</div>
                            <span style={{ fontWeight: 600, color: s.average_marks < 50 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{s.average_marks}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {meta.total_pages > 1 && (
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * meta.limit + 1} to {Math.min(page * meta.limit, meta.total)} of {meta.total} students
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={page === meta.total_pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Block */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Attendance Trend */}
            <div className="card">
              <div className="card-header"><span className="card-title">📈 Attendance Rate Trend</span></div>
              <div className="card-body">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.attendance_trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttClass" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={THEME_COLORS.secondary} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={THEME_COLORS.secondary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[60, 100]} unit="%" />
                      <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                      <Area type="monotone" dataKey="rate" stroke={THEME_COLORS.secondary} strokeWidth={2} fillOpacity={1} fill="url(#colorAttClass)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Academic Performance Marks Trend */}
            <div className="card">
              <div className="card-header"><span className="card-title">📚 Marks Average Trend</span></div>
              <div className="card-body">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.marks_trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[50, 100]} unit="%" />
                      <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="average" stroke={THEME_COLORS.primary} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            {/* Subject Performance */}
            <div className="card col-span-2">
              <div className="card-header"><span className="card-title">📊 Subject average marks</span></div>
              <div className="card-body">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subject_performance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                      <Bar dataKey="average" fill={THEME_COLORS.info} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Participation & Behavior scores */}
            <div className="card">
              <div className="card-header"><span className="card-title">🎯 Classroom soft skills score</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>Participation Index</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{analytics.participation_score}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.participation_score}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>Behavior Index</span>
                    <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>{analytics.behavior_score}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${analytics.behavior_score}%`, height: '100%', background: 'var(--color-secondary)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Top Performers */}
            <div className="card">
              <div className="card-header"><span className="card-title">🏆 Top Performers Leaderboard</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                {analytics.top_performers.map((item: any, idx: number) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < analytics.top_performers.length - 1 ? '1px solid var(--border-color)' : 'none', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 22, height: 22, background: idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? '#CD7F32' : 'var(--bg-secondary)', borderRadius: '50%', color: idx < 3 ? 'black' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                      <span className="badge badge-secondary" style={{ fontSize: 9 }}>{item.class_name}</span>
                    </div>
                    <span className="text-success font-semibold" style={{ marginLeft: 'auto', fontSize: 13 }}>{item.average_marks}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Students at Risk */}
            <div className="card">
              <div className="card-header"><span className="card-title">⚠️ Requiring Intervention / Checks</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                {analytics.at_risk.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>All students in Class {classId} are performing in stable thresholds.</div>
                ) : (
                  analytics.at_risk.map((item: any) => (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '12px 16px' }} onClick={() => handleStudentClick(item.id)}>
                      <div style={{ cursor: 'pointer' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.student_code}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ color: item.attendance_rate < 75 ? 'var(--color-danger)' : 'var(--text-muted)' }}>Att: {item.attendance_rate}%</span>
                        <span style={{ color: item.average_marks < 50 ? 'var(--color-danger)' : 'var(--text-muted)' }}>Avg: {item.average_marks}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
