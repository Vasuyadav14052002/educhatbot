import React, { useEffect } from 'react';
import { useGetTeacherProfileQuery } from './teachersApi';

interface DrawerProps {
  teacherId: string | null;
  subjectId: string;
  onClose: () => void;
}

export default function TeacherProfileDrawer({ teacherId, subjectId, onClose }: DrawerProps) {
  const { data: profile, isLoading, isError } = useGetTeacherProfileQuery(
    { teacherId: teacherId!, subjectId },
    { skip: !teacherId }
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!teacherId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480,
          background: '#ffffff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 1001, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#1f2937' // Base text color
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>Teacher Profile</h2>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '6px 12px', borderRadius: '20px', background: '#ffffff', 
              border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 500, color: '#374151',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            ✕ Close
          </button>
        </div>

        {isLoading ? (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: 16, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
            <p style={{ color: '#6b7280' }}>Loading profile...</p>
            <style>{`.spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : isError || !profile ? (
          <div className="flex-center" style={{ flex: 1, color: '#EF4444', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Failed to load teacher profile.
          </div>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <img src={profile.photoUrl} alt={profile.name} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>{profile.name}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 15, color: '#4f46e5', fontWeight: 600 }}>{profile.qualification}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📧 {profile.email}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📅 Joined: {new Date(profile.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div style={{ background: '#f9fafb', padding: 20, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', fontWeight: 600 }}>About</h4>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#4b5563' }}>{profile.bio}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 20, background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Experience</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: '#111827' }}>{profile.experienceYears} <span style={{fontSize: 14, fontWeight: 500, color: '#6b7280'}}>Years</span></div>
              </div>
              <div style={{ padding: 20, background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Leaves Taken</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: profile.leavesTaken > 5 ? '#EF4444' : '#111827' }}>{profile.leavesTaken}</div>
              </div>
              <div style={{ padding: 20, background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Syllabus Completed</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>{profile.syllabusCompleted}%</div>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${profile.syllabusCompleted}%`, background: profile.syllabusCompleted === 100 ? '#10B981' : '#4f46e5', borderRadius: 4, transition: 'width 1s ease-in-out' }} />
                </div>
              </div>
            </div>

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#111827', borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>Core Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.skills.map(s => (
                    <span key={s.id} style={{ 
                      padding: '6px 14px', background: '#eef2ff', color: '#4338ca', 
                      borderRadius: '20px', fontSize: 13, fontWeight: 600, border: '1px solid #c7d2fe' 
                    }}>
                      {s.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {profile.awards.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#111827', borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>Awards & Recognitions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {profile.awards.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: 28 }}>🏆</div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#92400e', fontSize: 15 }}>{a.title}</div>
                        <div style={{ fontSize: 13, color: '#b45309', marginTop: 4, fontWeight: 500 }}>{a.awarded_by} • {new Date(a.awarded_date).getFullYear()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classes Assigned */}
            {profile.classesAssigned.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#111827', borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>Classes Assigned</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.classesAssigned.map(c => (
                    <span key={c.id} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 14, fontWeight: 500, color: '#374151' }}>
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
