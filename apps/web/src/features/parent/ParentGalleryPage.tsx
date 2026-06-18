import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetParentGalleryQuery } from './parentApi';

export default function ParentGalleryPage() {
  const selectedStudent = useSelector((s: RootState) => s.auth.selected_student);
  const studentId = selectedStudent?.id;

  const { data: photos, isLoading } = useGetParentGalleryQuery({ studentId: studentId! }, { skip: !studentId });

  const [activePhoto, setActivePhoto] = useState<any | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!studentId) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🖼️</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Select Child</h2>
        <p style={{ color: 'var(--text-muted)' }}>Select a child to view their activity gallery.</p>
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
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading gallery photos...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const categories = ['ALL', ...Array.from(new Set((photos || []).map((p: any) => p.category)))];
  const filteredPhotos = filterCategory === 'ALL'
    ? (photos || [])
    : (photos || []).filter((p: any) => p.category === filterCategory);

  const handleDownload = (photoUrl: string, title: string) => {
    // Standard trigger download by opening image in new window/tab
    window.open(photoUrl, '_blank');
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Activity Gallery</h1>
          <p className="page-subtitle">Classroom events and cultural activities photos for {selectedStudent.first_name}</p>
        </div>
      </div>

      {/* Categories Filter list */}
      {photos && photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 16 }}>
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '6px 16px',
                fontSize: 12,
                textTransform: 'capitalize',
              }}
            >
              {cat.toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {filteredPhotos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filteredPhotos.map((photo: any) => (
            <div
              key={photo.id}
              className="card"
              style={{
                overflow: 'hidden',
                cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onClick={() => setActivePhoto(photo)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ position: 'relative', height: 200, width: '100%', background: 'var(--bg-tertiary)' }}>
                <img
                  src={photo.url}
                  alt={photo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  className="badge badge-primary"
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)',
                    background: 'rgba(79, 70, 229, 0.85)',
                  }}
                >
                  {photo.category}
                </span>
              </div>
              <div style={{ padding: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0 }}>
                  {photo.title}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Logged on {new Date(photo.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🖼️</div>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>No photos available</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Classroom or activity photos haven't been uploaded yet.
          </p>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {activePhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setActivePhoto(null)}
        >
          {/* Close trigger button */}
          <button
            onClick={() => setActivePhoto(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              color: 'white',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Card inner body */}
          <div
            style={{
              maxWidth: '90%',
              maxHeight: '85%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              }}
            />
            
            <div style={{ textAlign: 'center', color: 'white' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{activePhoto.title}</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                {activePhoto.category} · {new Date(activePhoto.date).toLocaleDateString()}
              </p>
              
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleDownload(activePhoto.url, activePhoto.title)}
                style={{ marginTop: 12, padding: '8px 20px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}
              >
                📥 Download High-Res Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
