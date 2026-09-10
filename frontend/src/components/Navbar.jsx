import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Building2, Clock, Shield } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'receptionist':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Hospital Branding */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/arogyam_logo.png"
            alt="Arogyam Hospital"
            className="h-10 w-auto object-contain rounded"
          />
          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight">
              AROGYAM HOSPITALS
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-none">
              Salt Lake City, Kolkata, West Bengal, India
            </p>
          </div>
        </div>

        {/* Right Section: OPD Clock, User Profile & Actions */}
        <div className="flex items-center gap-4">
          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{time}</span>
          </div>

          {/* User Profile Card */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.full_name}
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold rounded border tracking-wider ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  {user.department_name && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      · {user.department_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shadow-xs">
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Sign out of hospital system"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition duration-150"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
