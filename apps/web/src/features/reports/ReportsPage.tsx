export default function ReportsPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1 className="page-title">Reports & Exports</h1>
      <p className="page-subtitle">Generate custom reports, export data, and view historical records.</p>
      
      <div className="card" style={{ marginTop: 20, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h3>Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          The complete Reports module is under development.
          You will soon be able to generate CSV, PDF, and custom reports from this dashboard.
        </p>
      </div>
    </div>
  );
}
