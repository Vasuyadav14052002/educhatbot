import { Link } from 'react-router-dom';

export interface InsightCardProps {
  type: 'error' | 'warning' | 'info' | 'success';
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export default function InsightCard({
  type,
  icon,
  title,
  description,
  ctaLabel,
  ctaLink
}: InsightCardProps) {
  const colors = {
    error: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-primary)',
    success: 'var(--color-success)',
  };
  const color = colors[type];

  return (
    <div 
      style={{
        minWidth: 280,
        maxWidth: 320,
        flexShrink: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={icon} style={{ color, fontSize: 20 }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
        {description}
      </div>
      {ctaLink && ctaLabel && (
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <Link 
            to={ctaLink} 
            className="btn btn-ghost" 
            style={{ 
              padding: '4px 0', 
              fontSize: 13, 
              color: 'var(--color-primary)',
              height: 'auto',
              minHeight: 'auto'
            }}
          >
            {ctaLabel} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
