import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

export default function StudentDashboard() {
  const user = useSelector((s: RootState) => s.auth.user);

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>Welcome, {user?.first_name}!</h1>
      <p style={{ color: 'var(--text-muted)' }}>Student Dashboard is currently under construction.</p>
    </div>
  );
}
