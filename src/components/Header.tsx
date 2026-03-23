import React from 'react';
import { Menu, X } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMenuOpen, toggleMenu }) => {
  return (
    <header className="mobile-header glass-panel">
      <button 
        className="menu-toggle" 
        onClick={toggleMenu}
        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="logo-container">
        <div className="logo-icon">CS</div>
        <span className="logo-text">Capi Sport</span>
      </div>

      <div style={{ width: 40 }}></div> {/* Spacer for symmetry */}
    </header>
  );
};
