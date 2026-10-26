import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ toggleSidebar }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top border-bottom border-secondary-subtle px-3 py-2 shadow-sm">
      <div className="container-fluid p-0">
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-light d-lg-none p-1 px-2 border-0"
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar Navigation"
          >
            <i className="bi bi-list fs-3"></i>
          </button>
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div
              className="bg-primary text-dark rounded-3 d-flex align-items-center justify-content-center fw-bold fs-4 shadow-sm"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-activity"></i>
            </div>
            <div>
              <span className="navbar-brand fw-bold mb-0 text-white fs-4 tracking-tight">FitTrack</span>
              <span className="badge bg-danger ms-2 fs-7 uppercase">Admin</span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <ThemeToggle />

          {admin && (
            <div className="dropdown">
              <button
                className="btn btn-dark dropdown-toggle d-flex align-items-center gap-2 border border-secondary rounded-pill px-3 py-1 shadow-sm"
                type="button"
                id="adminDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div
                  className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: '32px', height: '32px', fontSize: '14px' }}
                >
                  {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="d-none d-md-inline fw-semibold text-white">{admin.name || 'Admin'}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" aria-labelledby="adminDropdown">
                <li className="px-3 py-2 text-muted border-bottom small">
                  <div>Signed in as</div>
                  <strong className="text-body">{admin.email}</strong>
                </li>
                <li>
                  <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right fs-5"></i>
                    <span>Log Out</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
