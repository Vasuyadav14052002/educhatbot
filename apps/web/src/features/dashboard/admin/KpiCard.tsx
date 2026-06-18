import { useNavigate } from 'react-router-dom';
import React from 'react';

export interface KpiCardProps {
  label: string;
  value?: string | number;
  icon: string | React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  link?: string;
  state: 'normal' | 'setup_required' | 'no_data';
  trend?: {
    delta: number | string;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  setupCta?: {
    label: string;
    link: string;
  };
  isLoading?: boolean;
}

export default function KpiCard({
  label,
  value,
  icon,
  color,
  link,
  state,
  trend,
  setupCta,
  isLoading
}: KpiCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link && state !== 'setup_required') {
      navigate(link);
    }
  };

  const handleSetupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setupCta?.link) navigate(setupCta.link);
  };

  return (
    <div 
      className={`stat-card ${color}`} 
      onClick={handleClick}
      style={{ cursor: link && state !== 'setup_required' ? 'pointer' : 'default', transition: 'border-color 0.2s' }}
      onMouseEnter={(e) => {
        if (link && state !== 'setup_required') {
          e.currentTarget.style.borderColor = 'var(--color-border-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (link && state !== 'setup_required') {
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }
      }}
    >
      <div className="stat-card-header">
        <div style={{ flex: 1 }}>
          <div className="stat-card-label">{label}</div>
          
          {isLoading ? (
            <span className="skeleton" style={{ width: 80, height: 36, display: 'block', marginTop: 4 }} />
          ) : state === 'setup_required' ? (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-alert-triangle" style={{ color: 'var(--color-warning)' }} />
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Not configured</span>
            </div>
          ) : state === 'no_data' ? (
            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              No data yet
            </div>
          ) : (
            <div className="stat-card-value">{value}</div>
          )}
        </div>
        
        <div className={`stat-card-icon ${color}`} style={{ fontSize: 24 }}>
          {icon}
        </div>
      </div>

      {!isLoading && state === 'normal' && trend && (
        <div className={`stat-card-change ${trend.direction}`}>
          {trend.delta} {trend.label}
        </div>
      )}

      {!isLoading && state === 'setup_required' && setupCta && (
        <div style={{ marginTop: 16 }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', fontSize: 13, padding: '6px 12px' }}
            onClick={handleSetupClick}
          >
            {setupCta.label} &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
