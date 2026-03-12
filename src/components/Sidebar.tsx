import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Settings, LogOut, Building2 } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/suppliers', icon: <Users size={20} />, label: 'Proveedores' },
    { to: '/products', icon: <Package size={20} />, label: 'Productos' },
    { to: '/clients', icon: <Building2 size={20} />, label: 'Clientes' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">CS</div>
          <span className="logo-text">Capi Sport</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <a href="#" className="nav-item">
          <Settings size={20} />
          <span>Ajustes</span>
        </a>
        <a href="#" className="nav-item text-danger">
          <LogOut size={20} />
          <span>Salir</span>
        </a>
      </div>
    </aside>
  );
};
