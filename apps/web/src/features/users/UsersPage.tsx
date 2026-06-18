import { useState } from 'react';
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSetStaffStatusMutation,
} from './usersApi';

export default function UsersPage() {
  const { data: staffList, isLoading, refetch } = useGetStaffQuery();
  const [createStaff] = useCreateStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [setStaffStatus] = useSetStaffStatusMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('TEACHER');

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('TEACHER');
  const [editStatus, setEditStatus] = useState('ACTIVE');

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
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading staff accounts...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) return;
    try {
      await createStaff({ first_name: firstName, last_name: lastName, email, phone, role }).unwrap();
      setShowAddModal(false);
      setFirstName(''); setLastName(''); setEmail(''); setPhone('');
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (staff: any) => {
    setEditingStaff(staff);
    setEditFirstName(staff.first_name || '');
    setEditLastName(staff.last_name || '');
    setEditPhone(staff.phone || '');
    setEditRole(staff.role || 'TEACHER');
    setEditStatus(staff.status || 'ACTIVE');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await updateStaff({
        id: editingStaff.id,
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        role: editRole,
        status: editStatus,
      }).unwrap();
      setShowEditModal(false);
      setEditingStaff(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (staff: any) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await setStaffStatus({ id: staff.id, status: nextStatus }).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Staff Registry</h1>
          <p className="page-subtitle">Add, manage, and update roles or active statuses for school staff</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Register Staff</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Access Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList && staffList.length > 0 ? (
                staffList.map((staff) => {
                  const initials = `${staff.first_name[0] || ''}${staff.last_name[0] || ''}`.toUpperCase();
                  const isActive = staff.status === 'ACTIVE';

                  return (
                    <tr key={staff.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            className="avatar-fallback"
                            style={{
                              width: 36,
                              height: 36,
                              fontSize: 12,
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                              color: 'white',
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {staff.first_name} {staff.last_name}
                          </div>
                        </div>
                      </td>
                      <td>{staff.email}</td>
                      <td>{staff.phone || '—'}</td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: 11 }}>
                          {staff.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${isActive ? 'present' : 'absent'}`} style={{ fontSize: 10 }}>
                          {staff.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-xs" onClick={() => handleEditClick(staff)}>
                            ✏️ Edit
                          </button>
                          <button
                            className={`btn btn-xs ${isActive ? 'btn-ghost' : 'btn-ghost'}`}
                            style={{ color: isActive ? 'var(--color-danger)' : 'var(--color-secondary)' }}
                            onClick={() => toggleStatus(staff)}
                          >
                            {isActive ? '🚫 Deactivate' : '⚡ Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No staff records found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Staff Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAddSubmit} className="card" style={{ width: 440, padding: 20, gap: 12, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Register New Staff</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="e.g. +91 98765 43210" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">System Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="TEACHER">Teacher</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register Account</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleEditSubmit} className="card" style={{ width: 440, padding: 20, gap: 12, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Edit Staff Account</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" required value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" required value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">System Role</label>
              <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                <option value="TEACHER">Teacher</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// Keep placeholders exported for router layout
const placeholder = (title: string, emoji: string) => () => (
  <div>
    <div className="page-header"><div><h1 className="page-title">{emoji} {title}</h1></div></div>
    <div className="card flex-center" style={{ height: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 14, marginTop: 8, color: 'var(--text-muted)' }}>This feature will be available shortly.</div>
      </div>
    </div>
  </div>
);

export const AcademicYearsPage = placeholder('Academic Years', '🗓️');
export const NotificationsPage = placeholder('Notifications', '🔔');
export const AuditLogsPage = placeholder('Audit Logs', '🛡️');
export const AnalyticsPage = placeholder('Analytics', '📊');
