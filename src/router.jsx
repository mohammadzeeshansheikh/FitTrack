import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';

// Components & Route Guard
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Trainers from './pages/Trainers';
import Plans from './pages/Plans';
import Payments from './pages/Payments';
import Equipment from './pages/Equipment';
import Sessions from './pages/Sessions';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        element: <PrivateRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'members',
            element: <Members />,
          },
          {
            path: 'trainers',
            element: <Trainers />,
          },
          {
            path: 'sessions',
            element: <Sessions />,
          },
          {
            path: 'plans',
            element: <Plans />,
          },
          {
            path: 'payments',
            element: <Payments />,
          },
          {
            path: 'equipment',
            element: <Equipment />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
