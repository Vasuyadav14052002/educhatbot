import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import Sidebar from './Sidebar';
import { setSelectedStudent, logout } from '../../store/authSlice';
import { useGetLinkedStudentsQuery } from '../../features/parent/parentApi';
import { useLazyGetStudentsQuery } from '../../features/students/studentsApi';

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/marks': 'Marks',
  '/progress': 'Daily Progress',
  '/participation': 'Participation',
  '/classes': 'Classes',
  '/subjects': 'Subjects',
  '/academic-years': 'Academic Years',
  '/users': 'Users',
  '/events': 'Events',
  '/notifications': 'Notifications',
  '/audit-logs': 'Audit Logs',
  '/reports': 'Reports',
  '/timeline': 'Timeline',
  '/messages': 'Messages',
  '/profile': 'Profile',
  '/gallery': 'Gallery',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useSelector((s: RootState) => s.auth.user);
  const selectedStudent = useSelector((s: RootState) => s.auth.selected_student);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const isParentOrStudent = user?.role === 'PARENT' || user?.role === 'STUDENT';
  const pageTitle = BREADCRUMB_MAP[location.pathname] || 'EduTrack AI';

  // Fetch linked students if parent or student
  const { data: linkedStudents } = useGetLinkedStudentsQuery(undefined, { skip: !isParentOrStudent });

  // Auto-select first child/student if none is selected
  useEffect(() => {
    if (isParentOrStudent && !selectedStudent && linkedStudents && linkedStudents.length > 0) {
      dispatch(setSelectedStudent(linkedStudents[0]));
    }
  }, [isParentOrStudent, selectedStudent, linkedStudents, dispatch]);

  // Child Switcher dropdown state
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  // User Profile dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Global Search state for staff
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [triggerSearch, { data: searchResults, isFetching: isSearching }] = useLazyGetStudentsQuery();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle hotkeys (focus search with '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 1) {
      triggerSearch({ page: 1, limit: 10, search: query });
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  return (
    <div className="app-layout" style={isParentOrStudent ? { display: 'block', minHeight: '100vh', background: 'var(--bg-secondary)' } : undefined}>
      {!isParentOrStudent && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}

      <div
        className={`main-content${collapsed && !isParentOrStudent ? ' sidebar-collapsed' : ''}`}
        style={isParentOrStudent ? { marginLeft: 0 } : undefined}
      >
        {/* Topbar */}
        <header
          className={`topbar${collapsed && !isParentOrStudent ? ' sidebar-collapsed' : ''}`}
          style={isParentOrStudent ? { left: 0 } : undefined}
        >
          <div className="topbar-left">
            {isParentOrStudent ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowChildDropdown(!showChildDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <div
                    className="avatar-fallback"
                    style={{
                      width: 28,
                      height: 28,
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                      color: 'white',
                    }}
                  >
                    {selectedStudent ? `${selectedStudent.first_name?.[0] ?? ''}${selectedStudent.last_name?.[0] ?? ''}`.toUpperCase() : '??'}
                  </div>
                  <span>{selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Select Child'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ transform: showChildDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>

                {showChildDropdown && linkedStudents && linkedStudents.length > 0 && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowChildDropdown(false)} />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 8,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000,
                        minWidth: 220,
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Linked Students
                      </div>
                      {linkedStudents.map((student: any) => (
                        <button
                          key={student.id}
                          onClick={() => {
                            dispatch(setSelectedStudent(student));
                            setShowChildDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: selectedStudent?.id === student.id ? 'var(--color-primary-surface)' : 'none',
                            color: selectedStudent?.id === student.id ? 'var(--color-primary)' : 'var(--text-primary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: selectedStudent?.id === student.id ? 600 : 500,
                          }}
                          onMouseEnter={(e) => {
                            if (selectedStudent?.id !== student.id) {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedStudent?.id !== student.id) {
                              e.currentTarget.style.background = 'none';
                            }
                          }}
                        >
                          <div
                            className="avatar-fallback"
                            style={{
                              width: 24,
                              height: 24,
                              fontSize: 9,
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                              color: 'white',
                            }}
                          >
                            {student.first_name?.[0] ?? ''}{student.last_name?.[0] ?? ''}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{student.first_name} {student.last_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {student.class ? `${student.class.name} ${student.class.section}` : 'Class Unassigned'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="breadcrumb">
                <span>EduTrack AI</span>
                <span>›</span>
                <span className="breadcrumb-current">{pageTitle}</span>
              </div>
            )}
          </div>

          <div className="topbar-right">
            {/* Global Search for Staff */}
            {!isParentOrStudent && (
              <div className="search-bar" style={{ position: 'relative' }}>
                <span className="search-bar-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted)">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  className="form-input"
                  placeholder="Search students... (Press /)"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim().length > 1 && setShowSearchResults(true)}
                  style={{ height: 38, fontSize: 13, paddingRight: 12 }}
                />

                {showSearchResults && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowSearchResults(false)} />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 8,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000,
                        maxHeight: 320,
                        overflowY: 'auto',
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {isSearching && (
                        <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                          Searching...
                        </div>
                      )}
                      {!isSearching && (!searchResults?.data || searchResults.data.length === 0) && (
                        <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                          No students found
                        </div>
                      )}
                      {!isSearching && searchResults?.data && searchResults.data.length > 0 && searchResults.data.map((student: any) => {
                        const initials = `${student.first_name?.[0] ?? ''}${student.last_name?.[0] ?? ''}`.toUpperCase();
                        return (
                          <button
                            key={student.id}
                            onClick={() => {
                              navigate(`/students/${student.id}`);
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              background: 'none',
                              color: 'var(--text-primary)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <div
                              className="avatar-fallback"
                              style={{
                                width: 32,
                                height: 32,
                                fontSize: 11,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                                color: 'white',
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{student.first_name} {student.last_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                #{student.student_code} · {student.class ? `${student.class.name} ${student.class.section}` : 'Unassigned'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notifications */}
            {!isParentOrStudent && (
              <button
                id="topbar-notifications"
                onClick={() => navigate('/notifications')}
                style={{
                  position: 'relative', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)', transition: 'var(--transition-fast)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                <span className="notif-dot" />
              </button>
            )}

            {/* Theme toggle */}
            <button
              id="topbar-theme"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
              }}
              onClick={() => {
                const html = document.documentElement;
                html.dataset.theme = html.dataset.theme === 'dark' ? '' : 'dark';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            </button>

            {/* User avatar menu */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 8px', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="avatar-fallback"
                  style={{
                    width: 34, height: 34,
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                    color: 'white', fontSize: 12, fontWeight: 700,
                  }}
                >
                  {user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` : '??'}
                </div>
                <div style={{ display: 'none', textDecoration: 'none' }} className="md-visible-flex">
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {showUserDropdown && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowUserDropdown(false)} />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 8,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 1000,
                      minWidth: 160,
                      padding: 4,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.first_name} {user?.last_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-danger)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="page-container"
          style={isParentOrStudent ? { padding: '16px', marginTop: 'var(--header-height)', paddingBottom: '90px', maxWidth: '100%' } : undefined}
        >
          <Outlet />
        </main>
      </div>

      {/* Parent Bottom Navigation (Mobile-first layout) */}
      {isParentOrStudent && (
        <nav
          className="bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            background: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000,
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 600,
              gap: 4,
              flex: 1,
              height: '100%',
            })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/timeline"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 600,
              gap: 4,
              flex: 1,
              height: '100%',
            })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span>Timeline</span>
          </NavLink>
          <NavLink
            to="/messages"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 600,
              gap: 4,
              flex: 1,
              height: '100%',
            })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
            <span>Messages</span>
          </NavLink>
          <NavLink
            to="/gallery"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 600,
              gap: 4,
              flex: 1,
              height: '100%',
            })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span>Gallery</span>
          </NavLink>
          <NavLink
            to="/profile"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 600,
              gap: 4,
              flex: 1,
              height: '100%',
            })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span>Profile</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
