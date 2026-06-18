import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetAcademicYearDetailsQuery, 
  useGetPromotionsQuery, 
  usePromoteStudentsMutation,
  useCloseAcademicYearMutation
} from './academicYearsApi';

export default function AcademicYearDetailDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useGetAcademicYearDetailsQuery(id as string, { skip: !id });
  const [closeYear, { isLoading: isClosing }] = useCloseAcademicYearMutation();

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data) return <div>Academic Year not found</div>;

  const { overview, summary, calendar, achievements, terms } = data;
  const isArchived = overview.status === 'ARCHIVED';

  return (
    <div style={{ paddingBottom: 40 }}>
      {isCloseModalOpen && (
        <CloseYearModal 
          academicYear={overview} 
          onClose={() => setIsCloseModalOpen(false)} 
          onConfirm={async (nextYearId) => {
            await closeYear({ id: id as string, confirmationText: 'Confirm', nextYearId });
            setIsCloseModalOpen(false);
          }} 
        />
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>← Back</button>
          <div>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {overview.name}
              <span className="badge" style={{ 
                background: isArchived ? 'var(--border-color)' : 'rgba(16, 185, 129, 0.1)', 
                color: isArchived ? 'var(--text-muted)' : '#10B981',
                textTransform: 'uppercase', fontSize: 11
              }}>
                {overview.status}
              </span>
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              {new Date(overview.start_date).toLocaleDateString()} to {new Date(overview.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" onClick={() => window.print()}>Print Reports</button>
          {!isArchived && (
            <button className="btn btn-danger" onClick={() => setIsCloseModalOpen(true)} disabled={isClosing}>
              {isClosing ? 'Closing...' : 'Close Academic Year'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        
        {/* ROW 1: SUMMARY STATS (Academic Year Summary) */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header"><h3 className="card-title">Academic Year Summary</h3></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <StatBox label="Enrolled" value={summary.enrolled} />
            <StatBox label="Promoted" value={summary.promoted} />
            <StatBox label="Graduated" value={summary.graduated} />
            <StatBox label="Transferred" value={summary.transferred} />
            <StatBox label="Dropouts" value={summary.dropouts} />
            <StatBox label="New Admissions" value={summary.newAdmissions} />
          </div>
        </div>

        {/* ROW 2: TERMS AND CALENDAR */}
        <div className="card" style={{ gridColumn: 'span 4', alignSelf: 'start' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Term Management</h3>
            {!isArchived && terms.length < 4 && <button className="btn btn-sm">+ Add Term</button>}
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {terms.map((term: any) => (
                <div key={term.id} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} className="hover-bg-gray">
                  <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    {term.name}
                    {term.is_current && <span style={{ fontSize: 11, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: 12 }}>Current</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 8', alignSelf: 'start' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Academic Calendar</h3>
            {!isArchived && <button className="btn btn-sm">+ Add Event</button>}
          </div>
          <div className="card-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event Name</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {calendar.map((ev: any) => {
                  const evDate = new Date(ev.event_date);
                  const isPast = ev.event_status === 'COMPLETED' || evDate < new Date();
                  
                  let typeColor = '#6B7280';
                  let typeBg = '#F3F4F6';
                  if (ev.event_type === 'EXAM') { typeColor = '#EF4444'; typeBg = '#FEE2E2'; }
                  if (ev.event_type === 'HOLIDAY') { typeColor = '#10B981'; typeBg = '#D1FAE5'; }
                  if (ev.event_type === 'CULTURAL' || ev.event_type === 'FUNCTION') { typeColor = '#8B5CF6'; typeBg = '#EDE9FE'; }
                  if (ev.event_type === 'SPORTS') { typeColor = '#3B82F6'; typeBg = '#DBEAFE'; }

                  return (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 500 }}>{evDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{ev.title}</td>
                      <td>
                        <span className="badge" style={{ background: typeBg, color: typeColor }}>{ev.event_type || 'EVENT'}</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: isPast ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.1)', color: isPast ? 'var(--text-muted)' : '#3B82F6' }}>
                          {ev.event_status || (isPast ? 'COMPLETED' : 'UPCOMING')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {calendar.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No events scheduled for this year.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROW 3: STUDENT PROMOTION CENTER */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header"><h3 className="card-title">Student Promotion Center</h3></div>
          <div className="card-body">
            {!isArchived ? (
              <StudentPromotionCenter academicYearId={id as string} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                This academic year is archived. Promotion actions are locked.
              </div>
            )}
          </div>
        </div>

        {/* ROW 4: ACHIEVEMENTS */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Major School Achievements</h3>
            {!isArchived && <button className="btn btn-sm">+ Add Achievement</button>}
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {achievements.map((ach: any) => (
              <div key={ach.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 32 }}>🏆</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{ach.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{ach.description}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)', fontSize: 11 }}>{ach.level || 'SCHOOL'}</span>
                    <span className="badge" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)', fontSize: 11 }}>{ach.category || 'ACADEMIC'}</span>
                  </div>
                </div>
              </div>
            ))}
            {achievements.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No recorded achievements for this academic year.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: number }) {
  return (
    <div style={{ padding: '16px 20px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSE YEAR MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CloseYearModal({ academicYear, onClose, onConfirm }: any) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false, c4: false });

  const allChecked = checks.c1 && checks.c2 && checks.c3 && checks.c4;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', padding: 32, borderRadius: 12, maxWidth: 600, width: '100%' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 24, color: '#EF4444' }}>Close Academic Year</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Closing the year <strong>{academicYear.name}</strong> will permanently lock all records, fees, and marks. Ensure all required tasks are completed.
        </p>

        {step === 1 && (
          <div>
            <h4 style={{ margin: '0 0 16px 0' }}>Pre-condition Checklist</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <label style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={checks.c1} onChange={e => setChecks({...checks, c1: e.target.checked})} style={{ width: 18, height: 18 }} />
                <span>All students have been promoted, graduated, or transferred.</span>
              </label>
              <label style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={checks.c2} onChange={e => setChecks({...checks, c2: e.target.checked})} style={{ width: 18, height: 18 }} />
                <span>All term marks have been finalized and locked.</span>
              </label>
              <label style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={checks.c3} onChange={e => setChecks({...checks, c3: e.target.checked})} style={{ width: 18, height: 18 }} />
                <span>All student fees for this year are settled or written off.</span>
              </label>
              <label style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={checks.c4} onChange={e => setChecks({...checks, c4: e.target.checked})} style={{ width: 18, height: 18 }} />
                <span>At least one UPCOMING academic year exists to become Active.</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={!allChecked} onClick={() => setStep(2)}>Proceed to Confirm</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', marginBottom: 24 }}>
              <strong>WARNING:</strong> This action is permanent and cannot be undone. 
              The status will be set to ARCHIVED.
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Type <strong style={{ userSelect: 'none' }}>{academicYear.name}</strong> to confirm closure.
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="input" 
                style={{ width: '100%', padding: '10px 12px' }}
                placeholder={academicYear.name}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-danger" disabled={confirmText !== academicYear.name} onClick={() => onConfirm()}>Close Academic Year</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT PROMOTION CENTER
// ─────────────────────────────────────────────────────────────────────────────
function StudentPromotionCenter({ academicYearId }: { academicYearId: string }) {
  const { data: classes, isLoading } = useGetPromotionsQuery(academicYearId);
  const [promote] = usePromoteStudentsMutation();
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // Row level states
  const [studentTargets, setStudentTargets] = useState<Record<string, { targetClassId: string, status: string }>>({});

  const sortedClasses = useMemo(() => {
    if (!classes) return [];
    return [...classes].sort((a: any, b: any) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [classes]);

  if (isLoading) return <div className="flex-center"><div className="spinner" /></div>;
  if (!sortedClasses || sortedClasses.length === 0) return <div>No classes found.</div>;

  const currentClassData = sortedClasses.find((c: any) => c.id === selectedClass);
  const selectedCount = Object.keys(studentTargets).length;

  const handleToggleStudent = (studentId: string, defaultNextClassId: string) => {
    setStudentTargets(prev => {
      const next = { ...prev };
      if (next[studentId]) {
        delete next[studentId];
      } else {
        next[studentId] = { targetClassId: defaultNextClassId, status: 'PROMOTED' };
      }
      return next;
    });
  };

  const handleRowTargetChange = (studentId: string, field: 'targetClassId' | 'status', value: string) => {
    setStudentTargets(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleBulkPromote = async () => {
    if (selectedCount === 0) return;
    
    const promotions = Object.entries(studentTargets).map(([studentId, data]) => ({
      studentId,
      fromClassId: selectedClass,
      toClassId: data.targetClassId || selectedClass,
      status: data.status
    }));

    if (window.confirm(`Submit promotion/retention for ${promotions.length} students?`)) {
      await promote({ promotions, academicYearId });
      setStudentTargets({});
    }
  };

  const getNextClassId = (currentClassName: string) => {
    const num = parseInt(currentClassName.replace(/\D/g, ''));
    if (!num) return '';
    const nextClass = sortedClasses.find((c: any) => c.name.includes((num + 1).toString()));
    return nextClass ? nextClass.id : '';
  };

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* LEFT: Class List */}
      <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classes</h4>
        {sortedClasses.map((c: any) => (
          <button 
            key={c.id} 
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              background: selectedClass === c.id ? 'var(--color-primary)' : 'var(--bg-body)',
              color: selectedClass === c.id ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px'
            }}
            onClick={() => { setSelectedClass(c.id); setStudentTargets({}); }}
          >
            {c.name} <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 12 }}>{c.students?.length || 0}</span>
          </button>
        ))}
      </div>

      {/* RIGHT: Student List & Actions */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: 24 }}>
        {currentClassData ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16 }}>Class {currentClassData.name} Promotion</h4>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedCount} students selected for action</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn btn-primary" disabled={selectedCount === 0} onClick={handleBulkPromote}>
                  Execute Selected Actions
                </button>
              </div>
            </div>

            <div className="table-container" style={{ flex: 1, maxHeight: 400, overflowY: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1 }}>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Student Name</th>
                    <th>Result (Mock)</th>
                    <th>Action</th>
                    <th>Promote To</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClassData.students.map((st: any) => {
                    const isSelected = !!studentTargets[st.id];
                    const targetData = studentTargets[st.id] || { targetClassId: getNextClassId(currentClassData.name), status: 'PROMOTED' };
                    // Mocking Result Badge for UI visualization since marks integration is separate
                    const isPass = Math.random() > 0.2; 
                    
                    return (
                      <tr key={st.id}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleToggleStudent(st.id, getNextClassId(currentClassData.name))} 
                          />
                        </td>
                        <td style={{ fontWeight: 500 }}>{st.first_name} {st.last_name}</td>
                        <td>
                          <span className="badge" style={{ background: isPass ? '#D1FAE5' : '#FEE2E2', color: isPass ? '#10B981' : '#EF4444' }}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td>
                          <select 
                            disabled={!isSelected}
                            value={targetData.status}
                            onChange={e => handleRowTargetChange(st.id, 'status', e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-color)', width: 120 }}
                          >
                            <option value="PROMOTED">Promote</option>
                            <option value="DETAINED">Detain</option>
                            <option value="GRADUATED">Graduate</option>
                          </select>
                        </td>
                        <td>
                          <select 
                            disabled={!isSelected || targetData.status === 'GRADUATED'}
                            value={targetData.targetClassId}
                            onChange={e => handleRowTargetChange(st.id, 'targetClassId', e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-color)', width: 150 }}
                          >
                            <option value="">Select Class...</option>
                            {sortedClasses.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {currentClassData.students.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students in this class.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)' }}>
            Select a class from the left to view and promote students.
          </div>
        )}
      </div>
    </div>
  );
}
