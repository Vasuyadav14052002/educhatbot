import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetParentStudentProfileQuery } from './parentApi';

export default function ParentPersonalDetailsPage() {
  const selectedStudent = useSelector((s: RootState) => s.auth.selected_student);
  const studentId = selectedStudent?.id;

  const { data: profile, isLoading } = useGetParentStudentProfileQuery({ studentId: studentId! }, { skip: !studentId });

  if (!studentId) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>👤</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Select Child</h2>
        <p style={{ color: 'var(--text-muted)' }}>Select a child to view their profile details.</p>
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
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading student profile...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = `${selectedStudent.first_name[0] || ''}${selectedStudent.last_name[0] || ''}`.toUpperCase();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Personal Profile</h1>
        <p className="page-subtitle">Official registrar records for {selectedStudent.first_name}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Top Header Card */}
        <div className="card" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            className="avatar-fallback"
            style={{
              width: 80,
              height: 80,
              fontSize: 28,
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
              color: 'white',
              border: '4px solid var(--border-color)',
            }}
          >
            {initials}
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>{profile?.first_name} {profile?.last_name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Student ID: #{profile?.student_code} · Class: {profile?.class ? `${profile?.class.name} ${profile?.class.section}` : 'Unassigned'}
            </p>
            <span className={`badge badge-${profile?.status === 'ACTIVE' ? 'present' : 'absent'}`} style={{ display: 'inline-block', marginTop: 8 }}>
              {profile?.status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid-2">
          {/* Academic Info */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 14 }}>
              🏫 Enrollment details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admission No</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{profile?.admission_no || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enrollment Date</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>School Affiliation</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{profile?.school?.name || 'EduTrack Academy'}</div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 14 }}>
              👤 Personal particulars
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date of Birth</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                  {profile?.dob ? new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gender</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                  {profile?.gender === 'MALE' ? 'Boy (Male)' : profile?.gender === 'FEMALE' ? 'Girl (Female)' : 'Other'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Address</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>{profile?.address || 'Not registered'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Health & Medical Information */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 14 }}>
            🩺 Medical Records & Emergency Info
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Blood Group</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{profile?.blood_group || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allergies</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: profile?.allergies ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                {profile?.allergies || 'None recorded'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Medical Conditions</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: profile?.medical_conditions ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                {profile?.medical_conditions || 'None recorded'}
              </div>
            </div>
            <div style={{ gridColumn: 'span 3', borderTop: '1px dashed var(--border-color)', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Emergency Contact / Guardian Phone</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                {profile?.emergency_contact || 'None specified'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
          💡 Contact the school administration if you need to request updates or corrections to these profile records.
        </div>

      </div>
    </div>
  );
}
