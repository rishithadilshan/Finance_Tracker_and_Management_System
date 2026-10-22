import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <Navbar />
      <main className="w-full px-6 lg:px-10 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PrivateRoute;
