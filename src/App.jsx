import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const location = useLocation();

  useEffect(() => {
    const routeTitles = {
      '/dashboard': 'Dashboard | FitTrack',
      '/members': 'Members Directory | FitTrack',
      '/trainers': 'Fitness Trainers | FitTrack',
      '/sessions': 'Training Sessions | FitTrack',
      '/plans': 'Membership Plans | FitTrack',
      '/payments': 'Payments History | FitTrack',
      '/equipment': 'Gym Equipment | FitTrack',
      '/login': 'Admin Login | FitTrack'
    };

    const currentTitle = routeTitles[location.pathname] || 'FitTrack — Gym Management System';
    document.title = currentTitle;
  }, [location]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Outlet />
    </>
  );
}

export default App;
