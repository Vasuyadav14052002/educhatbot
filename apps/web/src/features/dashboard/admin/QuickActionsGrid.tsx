import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { label: 'Mark Attendance', icon: '📋', path: '/attendance', color: '#4F46E5' },
  { label: 'Add Student', icon: '👨‍🎓', path: '/students/new', color: '#10B981' },
  { label: 'Upload Marks', icon: '📝', path: '/marks', color: '#F59E0B' },
  { label: 'Collect Fee', icon: '💳', path: '/fees/collect', color: '#06B6D4' },
  { label: 'Add Teacher', icon: '👩‍🏫', path: '/teachers/new', color: '#8B5CF6' },
  { label: 'View Reports', icon: '📊', path: '/reports', color: '#EC4899' },
  { label: 'Send Notice', icon: '📢', path: '/communication', color: '#F43F5E' },
  { label: 'Calendar', icon: '📅', path: '/academic-years', color: '#6366F1' },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: 32, height: 32, 
              borderRadius: 8, 
              background: `${action.color}15`, 
              color: action.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18
            }}>
              {action.icon}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
