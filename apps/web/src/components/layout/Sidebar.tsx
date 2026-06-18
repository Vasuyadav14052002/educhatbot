import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store';



interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : '??';

  // Filter navigation items by user role
  const filteredNavItems = NAV_ITEMS.map((section) => {
    const items = section.items.filter((item) => {
      // Parents should not access dashboard layout's sidebar (layout hides it anyway, but safety check)
      if (user?.role === 'PARENT') return false;

      // Teachers cannot access Analytics, Users, Academic Years, Audit Logs, Reports
      if (user?.role === 'TEACHER') {
        const forbiddenForTeachers = ['/analytics', '/users', '/academic-years', '/audit-logs', '/reports'];
        if (forbiddenForTeachers.includes(item.to)) {
          return false;
        }
      }
      return true;
    });
    return { ...section, items };
  }).filter((section) => section.items.length > 0);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">EduTrack AI</span>
        <button
          onClick={onToggle}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--color-gray-400)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <CollapseIcon />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredNavItems.map((section) => (
          <div key={section.section} style={{ marginBottom: 8 }}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-item${isActive ? ' active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-item-icon">
                  <item.icon />
                </span>
                <span className="sidebar-item-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 'var(--radius-md)',
          marginBottom: 4,
        }}>
          <div className="avatar-fallback" style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            color: 'white', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div className="sidebar-item-label min-w-0">
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ color: 'var(--color-gray-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Collapse toggle (collapsed state) */}
        {collapsed && (
          <button
            onClick={onToggle}
            className="sidebar-item"
            style={{ width: '100%', justifyContent: 'center' }}
            title="Expand sidebar"
          >
            <span className="sidebar-item-icon"><ExpandIcon /></span>
          </button>
        )}

        {/* Logout */}
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="sidebar-item"
          style={{ width: '100%', color: 'var(--color-danger)' }}
        >
          <span className="sidebar-item-icon"><LogoutIcon /></span>
          <span className="sidebar-item-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Icon Components ──────────────────────────────────────────────────────────
const icon = (path: string) => () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d={path} />
  </svg>
);

const DashboardIcon = icon('M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z');
const ChartIcon = icon('M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z');
const UsersIcon = icon('M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z');
const CalendarIcon = icon('M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z');
const CalendarIcon2 = icon('M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z');
const GradeIcon = icon('M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z');
const TrendIcon = icon('M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z');
const StarIcon = icon('M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z');
const BuildingIcon = icon('M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z');
const BookIcon = icon('M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z');
const UserIcon = icon('M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z');
const EventIcon = icon('M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z');
const BellIcon = icon('M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z');
const ShieldIcon = icon('M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z');
const ReportIcon = icon('M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z');
const LogoutIcon = icon('M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z');
const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
  </svg>
);
const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
  </svg>
);

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
      { to: '/analytics', icon: ChartIcon, label: 'Analytics' },
    ],
  },
  {
    section: 'Academic',
    items: [
      { to: '/students', icon: UsersIcon, label: 'Students' },
      { to: '/attendance', icon: CalendarIcon, label: 'Attendance' },
      { to: '/marks', icon: GradeIcon, label: 'Marks' },
      { to: '/progress', icon: TrendIcon, label: 'Progress' },
      { to: '/participation', icon: StarIcon, label: 'Participation' },
    ],
  },
  {
    section: 'Management',
    items: [
      { to: '/classes', icon: BuildingIcon, label: 'Classes' },
      { to: '/subjects', icon: BookIcon, label: 'Subjects' },
      { to: '/academic-years', icon: CalendarIcon2, label: 'Academic Years' },
      { to: '/users', icon: UserIcon, label: 'Users' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { to: '/events', icon: EventIcon, label: 'Events' },
      { to: '/notifications', icon: BellIcon, label: 'Notifications' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/audit-logs', icon: ShieldIcon, label: 'Audit Logs' },
      { to: '/reports', icon: ReportIcon, label: 'Reports' },
    ],
  },
];
