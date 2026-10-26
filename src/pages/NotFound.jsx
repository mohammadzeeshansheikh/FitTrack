import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body p-4 text-center">
      <div style={{ maxWidth: '480px' }}>
        <div className="display-1 fw-bold text-primary mb-2">404</div>
        <h3 className="fw-bold mb-2">Page Not Found</h3>
        <p className="text-secondary mb-4">
          The requested page URL does not exist or you do not have permission to view it.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-lg rounded-pill px-4 fw-bold shadow-sm">
          <i className="bi bi-house-door-fill me-2"></i>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
