import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { PatientSelfPortal } from './pages/PatientSelfPortal';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { PatientRegistration } from './pages/PatientRegistration';
import { PatientProfile } from './pages/PatientProfile';
import { CaseTaker } from './pages/CaseTaker';
import { PrescriptionView } from './pages/PrescriptionView';
import { CaseSummaryReport } from './pages/CaseSummaryReport';
import { AppointmentQueue } from './pages/AppointmentQueue';
import { PrescriptionsList } from './pages/PrescriptionsList';
import { DepartmentsList } from './pages/DepartmentsList';
import { DoctorsList } from './pages/DoctorsList';
import { AuditLogsView } from './pages/AuditLogsView';
import { NotFound } from './pages/NotFound';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<PatientSelfPortal />} />
            <Route path="/book" element={<PatientSelfPortal />} />

            {/* Protected Hospital Workspace Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Patient Management */}
                <Route path="/patients" element={<PatientList />} />
                <Route path="/patients/new" element={<PatientRegistration />} />
                <Route path="/patients/:id" element={<PatientProfile />} />

                {/* Clinical Case-Taking & Documents */}
                <Route path="/cases/new" element={<CaseTaker />} />
                <Route path="/cases/report/:id" element={<CaseSummaryReport />} />

                {/* Prescriptions & OPD Appointments */}
                <Route path="/appointments" element={<AppointmentQueue />} />
                <Route path="/prescriptions" element={<PrescriptionsList />} />
                <Route path="/prescriptions/:id" element={<PrescriptionView />} />

                {/* Master Rosters */}
                <Route path="/departments" element={<DepartmentsList />} />
                <Route path="/doctors" element={<DoctorsList />} />

                {/* Admin Audit Trail */}
                <Route
                  path="/audit-logs"
                  element={<AuditLogsView />}
                />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
