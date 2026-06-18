import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedStudent, logout } from '../../store/authSlice';
import { useVerifyStudentIdMutation } from './parentApi';
import { useNavigate } from 'react-router-dom';

interface Props {
  onVerified: () => void;
}

export default function StudentIdVerificationModal({ onVerified }: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [verifyStudent, { isLoading }] = useVerifyStudentIdMutation();

  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentCode.trim()) {
      setError('Please enter a Student ID');
      return;
    }

    try {
      const student = await verifyStudent({ studentCode: studentCode.trim() }).unwrap();
      setSuccess(true);
      dispatch(setSelectedStudent(student));

      // Small delay for success animation
      setTimeout(() => {
        onVerified();
      }, 800);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error?.data?.message || 'Invalid Student ID. Please check and try again.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="sid-modal-overlay">
      <div className="sid-modal-backdrop" />

      <div className={`sid-modal-card ${success ? 'sid-success' : ''}`}>
        {/* Decorative top glow */}
        <div className="sid-glow" />

        {/* Logo */}
        <div className="sid-logo">
          <div className="sid-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {success ? (
          <div className="sid-success-content">
            <div className="sid-check-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="sid-title" style={{ color: '#34d399' }}>Verified Successfully!</h2>
            <p className="sid-subtitle">Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <h2 className="sid-title">Enter Student ID</h2>
            <p className="sid-subtitle">
              Please enter your child's Student ID to access their academic records and dashboard.
            </p>

            {error && (
              <div className="sid-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="sid-form">
              <div className="sid-input-group">
                <label className="sid-label">Student ID</label>
                <div className="sid-input-wrapper">
                  <svg className="sid-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    className="sid-input"
                    placeholder="e.g. STU001"
                    value={studentCode}
                    onChange={(e) => {
                      setStudentCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <p className="sid-hint">
                  This is the unique code assigned to your child by the school.
                </p>
              </div>

              <button
                type="submit"
                className="sid-submit-btn"
                disabled={isLoading || !studentCode.trim()}
              >
                {isLoading ? (
                  <span className="sid-spinner-wrap">
                    <span className="sid-spinner" />
                    Verifying...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Verify & Continue
                  </span>
                )}
              </button>
            </form>

            <button
              onClick={handleLogout}
              className="sid-logout-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Sign out & use different account
            </button>
          </>
        )}
      </div>

      <style>{`
        .sid-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: sidFadeIn 0.3s ease-out;
        }

        .sid-modal-backdrop {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 10, 60, 0.95));
          backdrop-filter: blur(20px);
        }

        .sid-modal-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(30, 30, 50, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px 32px 32px;
          overflow: hidden;
          animation: sidSlideUp 0.4s ease-out;
          transition: all 0.4s ease;
        }

        .sid-modal-card.sid-success {
          border-color: rgba(52, 211, 153, 0.3);
          box-shadow: 0 0 40px rgba(52, 211, 153, 0.1);
        }

        .sid-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 120px;
          background: radial-gradient(ellipse, rgba(99, 102, 241, 0.35), transparent 70%);
          pointer-events: none;
        }

        .sid-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .sid-logo-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary, #6366f1), #818cf8);
          border-radius: 14px;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .sid-success-content {
          text-align: center;
          padding: 20px 0;
        }

        .sid-check-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(52, 211, 153, 0.15);
          border: 2px solid rgba(52, 211, 153, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #34d399;
          animation: sidPop 0.4s ease-out;
        }

        .sid-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          text-align: center;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }

        .sid-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .sid-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.25);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          color: #fda4af;
          font-size: 13px;
          line-height: 1.4;
          animation: sidShake 0.4s ease;
        }

        .sid-error svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .sid-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sid-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sid-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.02em;
        }

        .sid-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .sid-input-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
        }

        .sid-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 44px;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.08em;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .sid-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
          font-weight: 400;
          letter-spacing: 0.04em;
        }

        .sid-input:focus {
          border-color: var(--color-primary, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          background: rgba(255, 255, 255, 0.08);
        }

        .sid-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sid-hint {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          margin: 2px 0 0;
          line-height: 1.4;
        }

        .sid-submit-btn {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--color-primary, #6366f1), #818cf8);
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .sid-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
        }

        .sid-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .sid-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .sid-spinner-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sid-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        .sid-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 16px;
          padding: 10px;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sid-logout-btn:hover {
          color: rgba(244, 63, 94, 0.9);
          border-color: rgba(244, 63, 94, 0.2);
          background: rgba(244, 63, 94, 0.06);
        }

        @keyframes sidFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes sidSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes sidPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes sidShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
