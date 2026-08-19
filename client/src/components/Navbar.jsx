import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileCheck, LogOut, User, Shield, Building } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center font-bold shadow-md shadow-brand-900/20 group-hover:scale-105 transition-transform">
            <FileCheck className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight block leading-none">
              DFOS<span className="text-brand-600">.</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
              Digital File Opening System
            </span>
          </div>
        </Link>

        {/* User Actions */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Department Badge */}
            {user.department && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.department.name}</span>
              </div>
            )}

            {/* Role Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-semibold text-brand-700">
              {isStaff ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'STAFF' ? 'Staff Portal' : 'Student Portal'}</span>
            </div>

            {/* Profile Info */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-xs text-slate-500">{user.matricNo || user.email}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 rounded-lg shadow-sm transition-all"
            >
              Student Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
