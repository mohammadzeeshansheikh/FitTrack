import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { path: '/members', label: 'Members', icon: 'bi-people-fill' },
    { path: '/trainers', label: 'Trainers', icon: 'bi-person-badge-fill' },
    { path: '/sessions', label: 'Training Sessions', icon: 'bi-calendar-event-fill' },
    { path: '/plans', label: 'Membership Plans', icon: 'bi-card-checklist' },
    { path: '/payments', label: 'Payments', icon: 'bi-cash-stack' },
    { path: '/equipment', label: 'Equipment', icon: 'bi-tools' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 1040 }}
          onClick={closeSidebar}
        ></div>
      )}

      <aside
        className={`sidebar bg-body-tertiary border-end shadow-sm d-flex flex-column ${
          isOpen ? 'sidebar-open' : ''
        }`}
      >
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <span className="fw-bold text-primary text-uppercase tracking-wider small">Navigation</span>
          <button
            type="button"
            className="btn-close d-lg-none"
            aria-label="Close Sidebar"
            onClick={closeSidebar}
          ></button>
        </div>

        <ul className="nav nav-pills flex-column p-3 gap-1 mb-auto">
          {navItems.map((item) => (
            <li className="nav-item" key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-3 fw-medium ${
                    isActive ? 'active bg-primary text-white shadow-sm' : 'text-body hover-bg-light'
                  }`
                }
                onClick={closeSidebar}
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="p-3 border-top bg-body-secondary text-muted small text-center">
          <div>FitTrack v2.0 (India)</div>
          <div className="text-secondary fs-8">Admin Portal</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
