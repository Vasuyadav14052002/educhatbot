export default function EventsPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1 className="page-title">School Events</h1>
      <p className="page-subtitle">Manage upcoming school events, holidays, and extracurricular activities.</p>
      
      <div className="card" style={{ marginTop: 20, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <h3>Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          The complete Events management module is under development.
          You will soon be able to manage the school calendar, create events, and track RSVP from this dashboard.
        </p>
      </div>
    </div>
  );
}
