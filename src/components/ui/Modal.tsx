import React, { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 10000,
      overflowY: 'auto'
    }}>
      <div 
        className="glass-panel animate-fade-in" 
        style={{
          width: 'calc(100% - 2rem)',
          maxWidth: '500px',
          padding: '2rem',
          position: 'relative', 
          margin: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '1.5rem', cursor: 'pointer', zIndex: 1
          }}
        >
          &times;
        </button>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
};
