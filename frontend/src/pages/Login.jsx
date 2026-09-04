import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, Shield, Stethoscope, UserCheck, ArrowRight, Activity, Calendar, HeartPulse } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('dr.ananya@sanakahospital.com');
  const [password, setPassword] = useState('Doctor@2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await login(email, password);
      showSuccess(`Welcome back, ${data.full_name}`);
      navigate('/dashboard');
    } catch (err) {
      showError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (roleEmail, rolePwd) => {
    setEmail(roleEmail);
    setPassword(rolePwd);
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Left side: Hospital Image & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-slate-950 overflow-hidden border-r border-slate-800">
        <img
          src="/assets/sanaka_campus.jpg"
          alt="Sanaka Hospital Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/assets/sanaka_logo.png"
            alt="Sanaka Hospital"
            className="h-14 w-auto bg-white p-1.5 rounded-lg shadow-sm"
          />
          <div>
            <div className="text-xl font-bold tracking-tight text-white">SANAKA HOSPITALS</div>
            <div className="text-xs text-blue-300 font-medium">Shri Ramkrishna Institute of Medical Sciences</div>
          </div>
        </div>

        {/* Middle Value Text */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <Activity className="w-3.5 h-3.5" />
            <span>SIH 2026 Problem Statement SIH26047</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Patient Case-Taking & Medical Record Management System
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            A comprehensive clinical digital platform with multi-section OPD case taker, smart AI decision support, printable prescription pad, and direct online patient OPD booking.
          </p>

          {/* Quick Patient Portal Card on Left */}
          <div className="pt-2">
            <Link
              to="/portal"
              className="p-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 block transition space-y-1 group"
            >
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
                <span>Are you a Patient?</span>
                <span className="text-blue-400 group-hover:translate-x-1 transition flex items-center gap-1">
                  Book OPD Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xs text-slate-200">
                Book your doctor appointment online, submit symptoms in advance, and receive your OPD consultation token.
              </p>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-slate-800/80 pt-4 flex justify-between items-center">
          <span>A Unit of Sanaka Educational Trust</span>
          <span>Malandighi, Durgapur, WB</span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-slate-900">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Patient Portal Banner for Mobile & Top Access */}
          <Link
            to="/portal"
            className="p-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-between text-xs transition"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-emerald-200">Patient Self-Booking Portal</div>
                <div className="text-[11px] text-emerald-300/80">Book OPD Token & Enter Symptoms Online</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>

          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Staff & Doctor Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized hospital personnel portal for clinical case management.
            </p>
          </div>

          {/* Quick Demo Access Roles */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Demo Staff Logins</span>
              <span className="text-[10px] text-blue-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('dr.ananya@sanakahospital.com', 'Doctor@2026')}
                className={`p-2 rounded-lg text-left border transition text-xs flex flex-col items-start cursor-pointer ${
                  email === 'dr.ananya@sanakahospital.com'
                    ? 'bg-blue-600/30 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-blue-400 mb-1" />
                <span className="font-semibold text-[11px]">Doctor</span>
                <span className="text-[9px] text-slate-400">Dr. Ananya</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('receptionist@sanakahospital.com', 'Staff@2026')}
                className={`p-2 rounded-lg text-left border transition text-xs flex flex-col items-start cursor-pointer ${
                  email === 'receptionist@sanakahospital.com'
                    ? 'bg-emerald-600/30 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-semibold text-[11px]">Reception</span>
                <span className="text-[9px] text-slate-400">Front Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@sanakahospital.com', 'Sanaka@2026')}
                className={`p-2 rounded-lg text-left border transition text-xs flex flex-col items-start cursor-pointer ${
                  email === 'admin@sanakahospital.com'
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400 mb-1" />
                <span className="font-semibold text-[11px]">Admin</span>
                <span className="text-[9px] text-slate-400">Dr. B. K. Roy</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hospital Email / Staff ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sanakahospital.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500 pt-2">
            Sanaka Hospital EMR Portal · Authorized Personnel Only · 2026
          </div>
        </div>
      </div>
    </div>
  );
};
