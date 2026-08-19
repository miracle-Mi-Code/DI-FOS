import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileCheck, LogOut, User, Shield, Building, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group" onClick={closeMobile}>
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

          {/* Desktop: User Actions */}
          {user ? (
            <div className="hidden sm:flex items-center gap-4">
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
              <div className="text-right">
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
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
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

          {/* Mobile: Hamburger Button */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
            {user ? (
              <div className="px-4 py-4 space-y-3">
                {/* User Identity */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                    {isStaff ? (
                      <Shield className="w-4 h-4 text-brand-700" />
                    ) : (
                      <User className="w-4 h-4 text-brand-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.matricNo || user.email}</p>
                  </div>
                </div>

                {/* Department */}
                {user.department && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user.department.name}</span>
                  </div>
                )}

                {/* Role Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-semibold text-brand-700">
                  {isStaff ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'STAFF' ? 'Staff Portal' : 'Student Portal'}</span>
                </div>

                {/* Navigation Links */}
                {isStaff ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={closeMobile}
                    className="block w-full px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    📋 Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/student/dashboard"
                      onClick={closeMobile}
                      className="block w-full px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      🏠 My Dashboard
                    </Link>
                    <Link
                      to="/student/upload"
                      onClick={closeMobile}
                      className="block w-full px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      📂 Upload Documents
                    </Link>
                  </>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4 py-4 space-y-2">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="block w-full px-4 py-2.5 text-sm font-semibold text-center text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="block w-full px-4 py-2.5 text-sm font-semibold text-center text-white bg-brand-900 hover:bg-brand-800 rounded-lg transition-all"
                >
                  Student Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Backdrop overlay to close menu */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-30 bg-black/20"
          onClick={closeMobile}
        />
      )}
    </>
  );
};

export default Navbar;
