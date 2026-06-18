import { useNavigate } from 'react-router-dom';
import { useGetClassesOverviewQuery } from './classesApi';
import { GraduationCap, Users, Calendar, Award, ChevronRight, School } from 'lucide-react';

export default function ClassesPage() {
  const navigate = useNavigate();
  const { data: dbOverview = [], isLoading } = useGetClassesOverviewQuery();

  // Standard Class 1 to Class 12 cards
  const grades = Array.from({ length: 12 }, (_, i) => ({
    gradeNum: i + 1,
    name: `Class ${i + 1}`,
  }));

  const handleCardClick = (gradeNum: number) => {
    navigate(`/classes/${gradeNum}`);
  };

  return (
    <div className="classes-overview-container">
      {/* Header */}
      <div className="page-header card border-glow" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <School className="text-primary" size={28} />
            Classes & Academic Units
          </h1>
          <p className="page-subtitle">
            Overview of standard school units, section assignments, performance indices, and teacher assignments.
          </p>
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
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading academic units...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {grades.map((g) => {
            // Find corresponding grade data from database overview
            const dbGrade = dbOverview.find(
              (o) => o.name.toLowerCase() === g.name.toLowerCase()
            );

            const studentCount = dbGrade ? dbGrade.students : 0;
            const sections = dbGrade ? dbGrade.sections : 'None';
            const teacher = dbGrade ? dbGrade.teacher : 'Not Assigned';
            const attendance = dbGrade ? dbGrade.attendance : 'N/A';
            const performance = dbGrade ? dbGrade.performance : 'N/A';
            const hasData = studentCount > 0;

            return (
              <div
                key={g.name}
                className={`card class-grade-card ${hasData ? 'has-students border-glow-primary' : 'empty-grade'}`}
                onClick={() => handleCardClick(g.gradeNum)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Visual Accent for classes with active students */}
                {hasData && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    background: 'var(--color-primary)',
                  }} />
                )}

                <div className="card-body" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {g.name}
                      </h2>
                      {hasData ? (
                        <span className="badge badge-primary" style={{ marginTop: 4 }}>
                          Sections: {sections}
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ marginTop: 4 }}>
                          Inactive Unit
                        </span>
                      )}
                    </div>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: hasData ? 'var(--color-primary-surface)' : 'var(--bg-secondary)',
                      color: hasData ? 'var(--color-primary)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <GraduationCap size={20} />
                    </div>
                  </div>

                  {/* Class Stats & Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <Users size={14} /> Students:
                      </span>
                      <strong style={{ marginLeft: 'auto', color: 'var(--text-primary)' }}>{studentCount}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <School size={14} /> Teacher:
                      </span>
                      <strong
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--text-primary)',
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={teacher}
                      >
                        {teacher}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <Calendar size={14} /> Attendance:
                      </span>
                      <strong style={{ marginLeft: 'auto', color: 'var(--text-primary)' }}>{attendance}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <Award size={14} /> Performance:
                      </span>
                      <strong style={{ marginLeft: 'auto', color: 'var(--text-primary)' }}>{performance}</strong>
                    </div>
                  </div>

                  {/* Hover Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                  }}>
                    <span>View Roster</span>
                    <ChevronRight size={14} style={{ marginLeft: 2 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
