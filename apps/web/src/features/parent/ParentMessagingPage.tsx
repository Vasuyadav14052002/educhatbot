import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetParentMessagesQuery, useSendParentMessageMutation } from './parentApi';

export default function ParentMessagingPage() {
  const selectedStudent = useSelector((s: RootState) => s.auth.selected_student);
  const studentId = selectedStudent?.id;
  const user = useSelector((s: RootState) => s.auth.user);

  const { data: threads, isLoading, refetch } = useGetParentMessagesQuery({ studentId: studentId! }, { skip: !studentId });
  const [sendMessage, { isLoading: isSending }] = useSendParentMessageMutation();

  const [activeThreadIdx, setActiveThreadIdx] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll chat messages every 4 seconds to simulate real-time updates (or manual refresh)
  useEffect(() => {
    if (!studentId) return;
    const interval = setInterval(() => {
      refetch();
    }, 4000);
    return () => clearInterval(interval);
  }, [studentId, refetch]);

  // Set first thread active when threads load
  useEffect(() => {
    if (threads && threads.length > 0 && activeThreadIdx === null) {
      setActiveThreadIdx(0);
    }
  }, [threads, activeThreadIdx]);

  // Scroll to bottom when active thread or messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadIdx, threads]);

  if (!studentId) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>💬</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Select Child</h2>
        <p style={{ color: 'var(--text-muted)' }}>Select a child to message their teachers.</p>
      </div>
    );
  }

  if (isLoading && !threads) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading conversations...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeThread = activeThreadIdx !== null && threads?.[activeThreadIdx] ? threads[activeThreadIdx] : null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeThread || isSending) return;

    try {
      await sendMessage({
        studentId: studentId!,
        teacherId: activeThread.teacher.id,
        content: messageText.trim(),
      }).unwrap();
      setMessageText('');
      refetch();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 150px)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      
      {/* Sidebar - Threads list */}
      <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Conversations</h2>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Chat with {selectedStudent.first_name}'s teachers</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {threads && threads.length > 0 ? (
            threads.map((t: any, idx: number) => {
              const initials = `${t.teacher.first_name[0]}${t.teacher.last_name[0]}`.toUpperCase();
              const isActive = activeThreadIdx === idx;
              return (
                <button
                  key={t.teacher.id}
                  onClick={() => setActiveThreadIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--color-primary-surface)' : 'none',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'none';
                  }}
                >
                  <div
                    className="avatar-fallback"
                    style={{
                      width: 40,
                      height: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--color-primary)' : 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {t.teacher.first_name} {t.teacher.last_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {t.last_message ? t.last_message.content : 'No messages yet'}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No teachers linked.</div>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
        {activeThread ? (
          <>
            {/* Header */}
            <div style={{ padding: 16, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="avatar-fallback"
                style={{
                  width: 38,
                  height: 38,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  color: 'white',
                }}
              >
                {activeThread.teacher.first_name[0]}{activeThread.teacher.last_name[0]}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {activeThread.teacher.first_name} {activeThread.teacher.last_name}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Class Teacher</p>
              </div>
            </div>

            {/* Message Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeThread.messages && activeThread.messages.length > 0 ? (
                activeThread.messages.map((msg: any) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          background: isOwn ? 'var(--color-primary)' : 'var(--bg-primary)',
                          color: isOwn ? 'white' : 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          border: isOwn ? 'none' : '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        <div style={{ fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', fontSize: 13 }}>
                  <span>No messages in this chat. Start the conversation below.</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} style={{ padding: 16, background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
              <input
                type="text"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="form-input"
                style={{ flex: 1, borderRadius: 'var(--radius-md)', height: 40 }}
                disabled={isSending}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-md)', padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={!messageText.trim() || isSending}
              >
                <span>Send</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
