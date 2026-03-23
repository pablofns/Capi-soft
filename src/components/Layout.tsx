import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="app-container">
      <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} />
      
      {/* Backdrop for mobile */}
      {isMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <main className="main-content">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
