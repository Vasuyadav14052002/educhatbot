import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import ParentDashboard from '../parent/ParentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './admin/AdminDashboard';
import StudentDashboard from './student/StudentDashboard';

export default function DashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);

  if (!user) return null;

  switch (user.role) {
    case 'SCHOOL_ADMIN':
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return <div>Unknown Role Dashboard</div>;
  }
}
