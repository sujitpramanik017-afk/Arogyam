import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  ClipboardPenLine,
  Pill,
  Building2,
  Stethoscope,
  FileSpreadsheet,
  ScrollText,
  HelpCircle
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getNavItems = () => {
    const items = [];

    // Common Dashboard
    items.push({
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'receptionist'],
    });

    // Receptionist & Admin & Doctor: Patients Directory
    items.push({
      label: 'Patient Directory',
      path: '/patients',
      icon: Users,
      roles: ['admin', 'doctor', 'receptionist'],
    });

    // Receptionist & Admin: Register Patient
    items.push({
      label: 'New Registration',
      path: '/patients/new',
      icon: UserPlus,
      roles: ['admin', 'receptionist'],
    });

    // Appointments Queue
    items.push({
      label: 'OPD Appointments',
      path: '/appointments',
      icon: Calendar,
      roles: ['admin', 'doctor', 'receptionist'],
    });

    // Doctor & Admin: Digital Case-Taking
    items.push({
      label: 'Case-Taking Studio',
      path: '/cases/new',
      icon: ClipboardPenLine,
      roles: ['doctor'],
    });

    // Doctor & Admin: Prescriptions
    items.push({
      label: 'Prescriptions',
      path: '/prescriptions',
      icon: Pill,
      roles: ['admin', 'doctor'],
    });

    // Admin & General: Departments
    items.push({
      label: 'Departments',
      path: '/departments',
      icon: Building2,
      roles: ['admin', 'doctor', 'receptionist'],
    });

    // Admin & General: Doctors Roster
    items.push({
      label: 'Medical Staff',
      path: '/doctors',
      icon: Stethoscope,
      roles: ['admin', 'receptionist'],
    });

    // Admin Only: Audit Logs
    items.push({
      label: 'Audit & Access Logs',
      path: '/audit-logs',
      icon: ScrollText,
      roles: ['admin'],
    });

    return items.filter((item) => item.roles.includes(role));
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-61px)] no-print">
      {/* Role Navigation Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Menu
        </span>
        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
          SIH26047
        </span>
      </div>

      {/* Nav links */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Hospital System Footer Info */}
      <div className="p-3.5 m-3 rounded-lg bg-slate-800/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-200">Arogyam EMR System</div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Emergency OPD: 24x7 Active
        </div>
        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/50">
          Salt Lake City, Kolkata
        </div>
      </div>
    </aside>
  );
};
