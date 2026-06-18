import { useState, useEffect } from 'react';
import { useGetMarksClassesQuery, useGetMarksAcademicYearsQuery } from '../marks/marksApi';
import { useGetClassAttendanceQuery, useBulkMarkAttendanceMutation } from './attendanceApi';
import { CheckCircle } from 'lucide-react';

export default function AttendancePage() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: classes, isLoading: isClassesLoading } = useGetMarksClassesQuery();
  const { data: academicYears } = useGetMarksAcademicYearsQuery();

  const { data: dbRoster, isLoading: isRosterLoading } = useGetClassAttendanceQuery(
    { classId: classFilter, date: dateFilter },
    { skip: !classFilter || !dateFilter }
  );

  const [bulkMarkAttendance, { isLoading: isSaving }] = useBulkMarkAttendanceMutation();

  // Set default class once loaded
  useEffect(() => {
    if (classes && classes.length > 0 && !classFilter) {
      setClassFilter(classes[0].id);
    }
  }, [classes, classFilter]);

  // Sync database roster with local editing state
  useEffect(() => {
    if (dbRoster) {
      const state: Record<string, string> = {};
      dbRoster.forEach((student: any) => {
        state[student.student_id] = student.status || 'PRESENT';
      });
      setAttendance(state);
    }
  }, [dbRoster]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mark = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: string) => {
    if (!dbRoster) return;
    const all: Record<string, string> = {};
    dbRoster.forEach(s => { all[s.student_id] = status; });
    setAttendance(all);
  };

  const handleSave = async () => {
    if (!classFilter || !academicYears || academicYears.length === 0 || !dbRoster) return;
    
    // Find active/current academic year
    const activeAY = academicYears.find((ay: any) => ay.is_current) || academicYears[0];

    const entries = dbRoster.map((s: any) => ({
      student_id: s.student_id,
      status: attendance[s.student_id] || 'PRESENT',
      remarks: s.attendance?.remarks || undefined,
    }));

    try {
      await bulkMarkAttendance({
        date: dateFilter,
        academic_year_id: activeAY.id,
        entries,
      }).unwrap();
      triggerToast('📋 Attendance roster successfully updated & saved to database.');
    } catch (err) {
      alert('Failed to save attendance. Please try again.');
    }
  };

  const stats = {
    present: Object.values(attendance).filter(s => s === 'PRESENT').length,
    absent: Object.values(attendance).filter(s => s === 'ABSENT').length,
    late: Object.values(attendance).filter(s => s === 'LATE').length,
    leave: Object.values(attendance).filter(s => s === 'LEAVE').length,
    total: dbRoster?.length ?? 0,
  };

  return (
    <div>
      {/* Dynamic Toast Popup */}
      {toastMessage && (
        <div className="toast-overlay animate-fadeIn" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <div className="toast-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-lg)' }}>
            <CheckCircle size={18} color="var(--color-secondary)" />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Attendance Entry</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <button 
          className="btn btn-primary" 
          id="save-attendance-btn" 
          onClick={handleSave}
          disabled={isSaving || isRosterLoading || stats.total === 0}
        >
          {isSaving ? '⏳ Saving...' : '✅ Save Attendance'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Present', value: stats.present, color: 'success' },
          { label: 'Absent', value: stats.absent, color: 'danger' },
          { label: 'Late', value: stats.late, color: 'warning' },
          { label: 'Leave', value: stats.leave, color: 'primary' },
          { label: 'Total Enrolled', value: stats.total, color: 'primary' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ fontSize: 28 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Bulk Actions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="form-select" 
            style={{ width: 220 }}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            disabled={isClassesLoading}
          >
            {isClassesLoading ? (
              <option>Loading classes...</option>
            ) : (
              classes?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Section {c.section}
                </option>
              ))
            )}
          </select>

          <input 
            type="date" 
            className="form-input" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 160 }} 
          />

          <div className="divider" style={{ height: 28, width: 1, margin: 0, background: 'var(--border-color)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mark all as:</span>
          {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map(s => (
            <button 
              key={s} 
              className={`btn btn-sm badge badge-${s.toLowerCase().replace('_','-')}`} 
              style={{ cursor: 'pointer', border: '1px solid currentColor' }} 
              onClick={() => markAll(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div className="card">
        {isRosterLoading ? (
          <div className="flex-center" style={{ height: 160, flexDirection: 'column', gap: 8 }}>
            <div style={{
              width: 32, height: 32,
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}/>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading student roster...</span>
          </div>
        ) : dbRoster && dbRoster.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-color)' }}>
            {dbRoster.map((student: any) => {
              const studentStatus = attendance[student.student_id];
              const initials = student.name.split(' ').map((n: string) => n[0]).join('');
              
              return (
                <div key={student.student_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px', background: 'var(--bg-primary)',
                }}>
                  <div className="avatar-fallback" style={{
                    width: 38, height: 38, fontSize: 13, fontWeight: 700, flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                    color: 'white',
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{student.student_code}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => mark(student.student_id, s)}
                        style={{
                          padding: '4px 8px',
                          border: `1px solid ${studentStatus === s ? 'currentColor' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 10, fontWeight: 600,
                          cursor: 'pointer',
                          background: studentStatus === s
                            ? { PRESENT: 'var(--color-secondary)', ABSENT: 'var(--color-danger)', LATE: 'var(--color-warning)', LEAVE: 'var(--color-gray-400)' }[s]
                            : 'transparent',
                          color: studentStatus === s ? 'white' : 'var(--text-muted)',
                          transition: 'var(--transition-fast)',
                        }}
                      >
                        {s[0]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-center" style={{ height: 160, color: 'var(--text-muted)', fontSize: 13 }}>
            No active students found in this class.
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
