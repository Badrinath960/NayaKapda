'use client';

import { useEffect, useRef, useState } from 'react';

export function PWAInstallPrompt() {
  const deferredPromptRef = useRef<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      deferredPromptRef.current = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;
    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    deferredPromptRef.current = null;
  };

  if (!showPrompt || installed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem 1.25rem',
        borderRadius: '1rem',
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(249,115,22,0.3)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: '360px',
        width: 'calc(100vw - 2rem)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '0.75rem',
          background: 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={22} height={22} fill="none" stroke="#f97316" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f9fafb', margin: 0 }}>
          Install NayaKapda
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
          Add to home screen for quick access
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={() => setShowPrompt(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0.25rem',
            fontSize: '0.75rem',
          }}
        >
          Later
        </button>
        <button onClick={handleInstall} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          Install
        </button>
      </div>
    </div>
  );
}
