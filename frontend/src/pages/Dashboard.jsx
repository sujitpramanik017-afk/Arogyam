import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DoctorDashboard } from './DoctorDashboard';
import { ReceptionDashboard } from './ReceptionDashboard';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'receptionist') {
    return <ReceptionDashboard />;
  }

  return <DoctorDashboard />;
};
