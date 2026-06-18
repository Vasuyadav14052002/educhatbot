import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetAcademicYearsQuery, 
  useActivateAcademicYearMutation,
  useArchiveAcademicYearMutation
} from './academicYearsApi';
import NewAcademicYearModal from './NewAcademicYearModal';

export default function AcademicYearsPage() {
  const { data: years, isLoading } = useGetAcademicYearsQuery();
  const [activateYear] = useActivateAcademicYearMutation();
  const [archiveYear] = useArchiveAcademicYearMutation();
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('Newest');
  
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [activatingYear, setActivatingYear] = useState<any>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  // Filter & Sort
  let displayedYears = years ? [...years] : [];
  
  if (filterStatus !== 'All') {
    displayedYears = displayedYears.filter(y => y.status === filterStatus.toUpperCase());
  }

  displayedYears.sort((a, b) => {
    const timeA = new Date(a.start_date).getTime();
    const timeB = new Date(b.start_date).getTime();
    return sortOrder === 'Newest' ? timeB - timeA : timeA - timeB;
  });

  const handleActivateClick = (year: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    const hasActive = years?.some((y: any) => y.status === 'ACTIVE');
    if (hasActive) {
      setActivatingYear(year);
    } else {
      activateYear(year.id);
    }
  };

  const handleArchiveClick = (year: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    archiveYear(year.id);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {isNewModalOpen && <NewAcademicYearModal onClose={() => setIsNewModalOpen(false)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Academic Years Control Center</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Manage academic sessions, timelines, and promotions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>+ New Academic Year</button>
      </div>

      {/* Filter and Sort Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Active', 'Upcoming', 'Archived'].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{ 
                padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                background: filterStatus === status ? 'var(--color-primary)' : 'transparent',
                color: filterStatus === status ? '#fff' : 'var(--text-secondary)',
                border: filterStatus === status ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {status}
            </button>
          ))}
        </div>
        <div>
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-body)', cursor: 'pointer' }}
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        {/* Vertical Timeline Line */}
        <div style={{ position: 'absolute', left: 24, top: 20, bottom: 20, width: 2, background: 'var(--border-color)', zIndex: 0 }} />

        {displayedYears.map((year: any) => {
          const isActive = year.status === 'ACTIVE';
          const isArchived = year.status === 'ARCHIVED';
          const isUpcoming = year.status === 'UPCOMING';

          let badgeColor = 'var(--text-muted)';
          let badgeBg = 'var(--border-color)';
          if (isActive) {
            badgeColor = '#10B981';
            badgeBg = 'rgba(16, 185, 129, 0.1)';
          } else if (isUpcoming) {
            badgeColor = '#3B82F6';
            badgeBg = 'rgba(59, 130, 246, 0.1)';
          }

          return (
            <div 
              key={year.id} 
              className="card" 
              style={{ 
                marginLeft: 64, 
                position: 'relative', 
                border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                opacity: isArchived ? 0.65 : 1
              }}
              onClick={() => navigate(`/academic-years/${year.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Timeline Dot */}
              <div style={{ 
                position: 'absolute', 
                left: -49, 
                top: 32, 
                width: 18, 
                height: 18, 
                borderRadius: '50%', 
                background: isActive ? 'var(--color-primary)' : (isArchived ? 'var(--text-muted)' : 'var(--bg-surface)'), 
                border: `4px solid ${isActive ? 'var(--bg-body)' : 'var(--border-color)'}`,
                zIndex: 1,
                boxShadow: isActive ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : 'none'
              }} />

              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isArchived ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{year.name}</h2>
                    <span className="badge" style={{ background: badgeBg, color: badgeColor, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                      {year.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📅</span> Start: {new Date(year.start_date).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏁</span> End: {new Date(year.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{year.studentCount || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{year.classCount || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{year.teacherCount || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teachers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{year.termCount || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Terms</div>
                  </div>
                  
                  {/* Kebab Action Menu */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === year.id ? null : year.id); }}
                      style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 8, color: 'var(--text-muted)' }}
                    >
                      ⋮
                    </button>
                    {menuOpenId === year.id && (
                      <div style={{ 
                        position: 'absolute', right: 0, top: 40, width: 180, background: 'var(--bg-surface)', 
                        border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 
                      }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/academic-years/${year.id}`); }} style={menuItemStyle}>View Details</button>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} style={menuItemStyle}>Edit</button>
                        {isUpcoming && <button onClick={(e) => handleActivateClick(year, e)} style={menuItemStyle}>Set as Active</button>}
                        {isActive && <button onClick={(e) => handleArchiveClick(year, e)} style={menuItemStyle}>Archive</button>}
                        {isUpcoming && <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} style={{...menuItemStyle, color: '#EF4444'}}>Delete</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activation Warning Modal */}
      {activatingYear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', padding: 32, borderRadius: 12, maxWidth: 480, width: '100%' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, color: '#EF4444' }}>⚠️ Change Active Academic Year</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Another academic year is currently active. Activating <strong>{activatingYear.name}</strong> will automatically archive the current active year. 
              All student records, fees, and attendance for the old year will be locked. 
              <br/><br/>
              Are you sure you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setActivatingYear(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#EF4444', borderColor: '#EF4444' }} onClick={() => {
                activateYear(activatingYear.id);
                setActivatingYear(null);
              }}>
                Yes, Activate {activatingYear.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  width: '100%',
  textAlign: 'left' as const,
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer',
  fontSize: 14,
  color: 'var(--text-primary)'
};
