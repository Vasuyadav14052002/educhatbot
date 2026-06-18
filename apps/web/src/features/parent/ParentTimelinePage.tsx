import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetParentTimelineQuery } from './parentApi';

export default function ParentTimelinePage() {
  const selectedStudent = useSelector((s: RootState) => s.auth.selected_student);
  const studentId = selectedStudent?.id;

  const { data: timeline, isLoading } = useGetParentTimelineQuery({ studentId: studentId! }, { skip: !studentId });

  if (!studentId) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>👨‍👩‍👧</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Select Child</h2>
        <p style={{ color: 'var(--text-muted)' }}>Select a child to view their chronological timeline.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading activity feed...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ATTENDANCE': return { char: '📋', color: '#10B981', bg: '#ECFDF5' };
      case 'MARK':
      case 'MARKS': return { char: '💯', color: '#3B82F6', bg: '#EFF6FF' };
      case 'BADGE': return { char: '🏅', color: '#8B5CF6', bg: '#F5F3FF' };
      case 'ACHIEVEMENT': return { char: '🏆', color: '#F59E0B', bg: '#FFFBEB' };
      case 'REMARK': return { char: '💬', color: '#EC4899', bg: '#FDF2F8' };
      case 'CULTURAL': return { char: '🎭', color: '#06B6D4', bg: '#ECFEFF' };
      default: return { char: '📌', color: '#64748B', bg: '#F8FAFC' };
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '8px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Child Activity Feed</h1>
        <p className="page-subtitle">Chronological update timeline for {selectedStudent.first_name}</p>
      </div>

      {timeline && timeline.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--border-color)', marginLeft: 16 }}>
          {timeline.map((event: any, idx: number) => {
            const { char, color, bg } = getEventIcon(event.type);
            return (
              <div key={idx} style={{ position: 'relative', marginBottom: 28 }}>
                {/* Timeline node */}
                <div
                  style={{
                    position: 'absolute',
                    left: -41,
                    top: 2,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: bg,
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    zIndex: 2,
                  }}
                >
                  {char}
                </div>

                {/* Event details card */}
                <div
                  className="card"
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {event.title}
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(event.created_at).toLocaleDateString()} · {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>No updates yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Activities will appear here as teachers log marks, attendance, remarks, and badges.
          </p>
        </div>
      )}
    </div>
  );
}
