import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetSubjectDashboardQuery, 
  useGetSubjectSyllabusQuery, 
  useGetSubjectResourcesQuery, 
  useGetSubjectActivityQuery 
} from './subjectsApi';
import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import TeacherProfileDrawer from '../teachers/TeacherProfileDrawer';

export default function SubjectDetailDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashLoading } = useGetSubjectDashboardQuery(id as string, { skip: !id });
  const { data: syllabus, isLoading: sylLoading } = useGetSubjectSyllabusQuery(id as string, { skip: !id });
  const { data: resources, isLoading: resLoading } = useGetSubjectResourcesQuery(id as string, { skip: !id });
  const { data: activity, isLoading: actLoading } = useGetSubjectActivityQuery(id as string, { skip: !id });

  const [sylPage, setSylPage] = useState(1);
  const [resPage, setResPage] = useState(1);
  const [actPage, setActPage] = useState(1);
  const [stuPage, setStuPage] = useState(1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  if (dashLoading || sylLoading || resLoading || actLoading) {
    return (
      <div className="flex-center" style={{ height: 400 }}>
        <div className="spinner" />
        <style>{`.spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!dashboard) return <div>Subject not found</div>;

  const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
  const gradeData = Object.entries(dashboard.marksAnalytics.gradeDistribution).map(([name, value]) => ({ name, value }));

  // Pagination logic
  const allTopics = syllabus?.flatMap((syl: any) => syl.topics.map((t: any) => ({ ...t, unit_name: syl.unit_name }))) || [];
  const SYL_PAGE_SIZE = 5;
  const paginatedSyl = allTopics.slice((sylPage - 1) * SYL_PAGE_SIZE, sylPage * SYL_PAGE_SIZE);

  const RES_PAGE_SIZE = 5;
  const paginatedRes = resources?.slice((resPage - 1) * RES_PAGE_SIZE, resPage * RES_PAGE_SIZE) || [];

  const ACT_PAGE_SIZE = 5;
  const paginatedAct = activity?.slice((actPage - 1) * ACT_PAGE_SIZE, actPage * ACT_PAGE_SIZE) || [];

  const STU_PAGE_SIZE = 8;
  const paginatedStu = dashboard.studentPerformance.slice((stuPage - 1) * STU_PAGE_SIZE, stuPage * STU_PAGE_SIZE);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>← Back</button>
          <div>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {dashboard.overview.name}
              <span style={{ fontSize: 12, padding: '4px 8px', background: 'var(--color-primary)', color: '#fff', borderRadius: 12 }}>{dashboard.overview.code}</span>
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>{dashboard.overview.description}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>Export Report</button>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, gridAutoRows: 'minmax(100px, auto)' }}>
        
        {/* KPI CARDS (Row 1) */}
        <KPICard title="Total Classes" value={dashboard.kpis.totalClasses} icon="🏫" colSpan={3} />
        <KPICard title="Total Students" value={dashboard.kpis.totalStudents} icon="🧑‍🎓" colSpan={3} />
        <KPICard title="Average Score" value={`${dashboard.kpis.averageSubjectScore}%`} icon="📈" colSpan={3} />
        <KPICard title="HW Completion" value={`${dashboard.kpis.homeworkCompletionRate}%`} icon="📝" colSpan={3} />

        {/* ANALYTICS SECTION (Row 2 & 3) */}
        <div className="card" style={{ gridColumn: 'span 8', gridRow: 'span 3', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><h3 className="card-title">Class Performance Comparison</h3></div>
          <div className="card-body" style={{ flex: 1, padding: '16px 0 0 0' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={dashboard.classMapping} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="averageMarks" name="Avg Marks %" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance %" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRADE DISTRIBUTION PIE CHART */}
        <div className="card" style={{ gridColumn: 'span 4', gridRow: 'span 3', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><h3 className="card-title">Grade Distribution</h3></div>
          <div className="card-body flex-center" style={{ flex: 1, flexDirection: 'column' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={gradeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {gradeData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: 'none', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 }}>
              {gradeData.map((g, i) => (
                <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {g.name}: {g.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI INSIGHTS */}
        <div className="card" style={{ gridColumn: 'span 12', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-primary)' }}>AI Subject Insights</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dashboard.insights.map((ins: string, idx: number) => (
                <li key={idx} style={{ color: 'var(--text-secondary)' }}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* SYLLABUS TRACKING */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header"><h3 className="card-title">Syllabus & Topics Tracker</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Topic</th>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSyl.map((t: any) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.unit_name}</td>
                      <td>{t.topic_name}</td>
                      <td>{t.class.name}</td>
                      <td>{t.teacher.first_name}</td>
                      <td>
                        <span className="badge" style={{ 
                          background: t.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : t.status === 'In Progress' ? 'rgba(59, 130, 246, 0.1)' : 'var(--border-color)',
                          color: t.status === 'Completed' ? '#10B981' : t.status === 'In Progress' ? '#3B82F6' : 'var(--text-muted)'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${t.progress}%`, background: t.progress === 100 ? '#10B981' : 'var(--color-primary)' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedSyl.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No syllabus topics found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination total={allTopics.length} current={sylPage} onChange={setSylPage} pageSize={SYL_PAGE_SIZE} />
          </div>
        </div>

        {/* RESOURCES & ACTIVITY - 2 GRID COLUMNS IN ONE SECTION */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header"><h3 className="card-title">Subject Hub</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, padding: 16 }}>
              {/* RESOURCES */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject Resources</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {paginatedRes.map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 24 }}>{r.type === 'PDF' ? '📄' : r.type === 'Video' ? '🎬' : '📁'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Added by {r.uploader.first_name}</div>
                      </div>
                      <a href={r.url} target="_blank" rel="noreferrer" className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>View</a>
                    </div>
                  ))}
                  {paginatedRes.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No resources uploaded.</div>}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <Pagination total={resources?.length || 0} current={resPage} onChange={setResPage} pageSize={RES_PAGE_SIZE} />
                </div>
              </div>

              {/* ACTIVITY */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Teacher Activity</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  {paginatedAct.map((act: any) => (
                    <div key={act.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 6 }} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 600 }}>{act.teacher.first_name}</span> {act.action}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(act.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {paginatedAct.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent activity.</div>}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <Pagination total={activity?.length || 0} current={actPage} onChange={setActPage} pageSize={ACT_PAGE_SIZE} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STUDENT PERFORMANCE ROSTER */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header"><h3 className="card-title">Student Performance Roster</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Attendance %</th>
                    <th>Avg Marks</th>
                    <th>HW Completion</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStu.map((st: any) => (
                    <tr key={st.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{st.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.student_code}</div>
                      </td>
                      <td>{st.className}</td>
                      <td>
                        <div style={{ color: st.attendance < 75 ? '#EF4444' : 'inherit' }}>{st.attendance}%</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: st.averageMarks >= 80 ? '#10B981' : st.averageMarks < 50 ? '#EF4444' : 'inherit' }}>
                          {st.averageMarks}%
                        </div>
                      </td>
                      <td>{st.homeworkCompletion}%</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>{st.status}</span>
                      </td>
                    </tr>
                  ))}
                  {paginatedStu.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination total={dashboard.studentPerformance.length} current={stuPage} onChange={setStuPage} pageSize={STU_PAGE_SIZE} />
          </div>
        </div>

        {/* SUBJECT TEACHERS GRID */}
        <div className="card" style={{ gridColumn: 'span 12', marginTop: 16 }}>
          <div className="card-header"><h3 className="card-title">Subject Teachers</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {dashboard.teachers?.map((t: any) => (
                <div 
                  key={t.id} 
                  className="card"
                  style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 16 }}
                  onClick={() => setSelectedTeacherId(t.id)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img src={t.photoUrl} alt={t.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{t.qualification} • {t.experienceYears} Yrs Exp</p>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-body)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Syllabus Completed</span>
                      <span style={{ color: 'var(--color-primary)' }}>{t.syllabusCompleted}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${t.syllabusCompleted}%`, background: t.syllabusCompleted === 100 ? '#10B981' : 'var(--color-primary)' }} />
                    </div>
                  </div>
                </div>
              ))}
              {(!dashboard.teachers || dashboard.teachers.length === 0) && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No teachers assigned to this subject.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      <TeacherProfileDrawer 
        teacherId={selectedTeacherId} 
        subjectId={id as string} 
        onClose={() => setSelectedTeacherId(null)} 
      />
    </div>
  );
}

function KPICard({ title, value, icon, colSpan }: { title: string, value: string | number, icon: string, colSpan: number }) {
  return (
    <div className="card" style={{ gridColumn: `span ${colSpan}`, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function Pagination({ total, current, onChange, pageSize }: { total: number, current: number, onChange: (p: number) => void, pageSize: number }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid var(--border-color)' }}>
      <button className="btn" disabled={current === 1} onClick={() => onChange(current - 1)} style={{ padding: '4px 12px', fontSize: 12 }}>Prev</button>
      <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>Page {current} of {pages}</span>
      <button className="btn" disabled={current === pages} onClick={() => onChange(current + 1)} style={{ padding: '4px 12px', fontSize: 12 }}>Next</button>
    </div>
  );
}
