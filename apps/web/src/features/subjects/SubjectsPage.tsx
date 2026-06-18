import { useNavigate } from 'react-router-dom';
import { useGetSubjectsListQuery } from './subjectsApi';

export default function SubjectsPage() {
  const { data: subjects = [], isLoading } = useGetSubjectsListQuery();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: 400 }}>
        <div className="spinner" />
        <style>{`.spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Subjects</h1>
          <p className="page-subtitle">Manage subjects and teacher assignments</p>
        </div>
        <button className="btn btn-primary">+ Add Subject</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {subjects.map((sub: any) => (
          <div 
            key={sub.code} 
            className="card" 
            style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid var(--border-color)' }}
            onClick={() => navigate(`/subjects/${sub.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ height: 6, background: sub.color || 'var(--color-primary)' }} />
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ 
                  width: 44, height: 44, 
                  borderRadius: 'var(--radius-md)', 
                  background: (sub.color || '#4F46E5') + '20', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: sub.color || 'var(--color-primary)', 
                  fontWeight: 800, fontSize: 13 
                }}>
                  {sub.code}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{sub.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sub.code}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>🏫 {sub.classes} classes</span>
                <span>👩‍🏫 {sub.teachers} teachers</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
