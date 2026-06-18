import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Pagination } from '../../components/ui/DataTable';
import { useGetStudentsQuery } from './studentsApi';

const COLUMNS = [
  {
    key: 'photo_url',
    label: '',
    width: '48px',
    render: (_: unknown, row: Record<string, unknown>) => {
      const initials = `${String(row.first_name || '')[0] || ''}${String(row.last_name || '')[0] || ''}`.toUpperCase();
      return (
        <div className="avatar-fallback" style={{
          width: 34, height: 34, fontSize: 12, fontWeight: 700,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
          color: 'white',
        }}>
          {initials}
        </div>
      );
    },
  },
  {
    key: 'full_name',
    label: 'Student',
    render: (_: unknown, row: Record<string, unknown>) => (
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {String(row.first_name)} {String(row.last_name)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          #{String(row.student_code || '')} · {String(row.admission_no || '')}
        </div>
      </div>
    ),
  },
  {
    key: 'class',
    label: 'Class',
    render: (_: unknown, row: Record<string, unknown>) => {
      const cls = row.class as { name: string; section: string } | undefined;
      return cls ? (
        <span className="badge badge-primary">{cls.name} {cls.section}</span>
      ) : '—';
    },
  },
  {
    key: 'gender',
    label: 'Gender',
    render: (v: unknown) => (
      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
        {v === 'MALE' ? '👦 Male' : v === 'FEMALE' ? '👧 Female' : '⚧ Other'}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (v: unknown) => (
      <span className={`badge badge-${v === 'ACTIVE' ? 'present' : 'absent'}`}>{String(v)}</span>
    ),
  },
  {
    key: 'parent_relations',
    label: 'Parent',
    render: (v: unknown) => {
      const relations = v as Array<{ parent: { first_name: string; last_name: string } }> | undefined;
      return relations?.[0] ? (
        <span style={{ fontSize: 13 }}>{relations[0].parent.first_name} {relations[0].parent.last_name}</span>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not linked</span>;
    },
  },
];

export default function StudentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetStudentsQuery({ page, limit: 20, search: search || undefined });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {isLoading ? 'Loading...' : `${data?.meta?.total ?? 0} students enrolled`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm">
            📥 Import CSV
          </button>
          <button className="btn btn-primary btn-sm" id="add-student-btn">
            + Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
              <span className="search-bar-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted)">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </span>
              <input
                type="search"
                className="form-input"
                placeholder="Search by name, ID, or admission no..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', fontSize: 14 }}
              />
            </div>
            <select className="form-select" style={{ width: 160 }}>
              <option value="">All Classes</option>
            </select>
            <select className="form-select" style={{ width: 140 }}>
              <option value="ACTIVE">Active</option>
              <option value="">All Status</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="GRADUATED">Graduated</option>
            </select>
            <select className="form-select" style={{ width: 140 }}>
              <option value="">All Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={COLUMNS}
        data={(data?.data ?? []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => navigate(`/students/${String((row as { id: string }).id)}`)}
        emptyMessage="No students found. Try adjusting your search."
      />

      {data?.meta && (
        <Pagination
          page={page}
          total_pages={data.meta.total_pages}
          onPage={setPage}
        />
      )}
    </div>
  );
}
