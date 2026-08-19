import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Lock, Mail, ArrowRight, KeyRound, ShieldAlert, Key, CheckCircle2, Zap } from 'lucide-react';
import Toast from '../../components/Toast';

export const LoginPage = () => {
  const { login, verifyOtp, resendOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification Modal State for unverified logins
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPhoneOrEmail, setOtpPhoneOrEmail] = useState('');
  const [currentOtpCode, setCurrentOtpCode] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: request, 2: verify & set new password
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ message: '', type: 'info' });

    try {
      const data = await login(identifier, password);
      setToast({ message: 'Login successful!', type: 'success' });
      
      // Redirect based on role
      if (data.user.role === 'STAFF' || data.user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requiresOtp) {
        setOtpPhoneOrEmail(errorData.phone || errorData.email);
        if (errorData.code) setCurrentOtpCode(errorData.code);
        setShowOtpModal(true);
        setToast({ message: errorData.error, type: 'info' });
      } else {
        setToast({ message: errorData?.error || 'Failed to log in. Please check credentials.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyOtp(otpPhoneOrEmail, otpCode);
      setShowOtpModal(false);
      setCurrentOtpCode('');
      setToast({ message: 'Account verified successfully!', type: 'success' });
      if (data.user.role === 'STAFF' || data.user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Invalid OTP code.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const data = await resendOtp(otpPhoneOrEmail);
      if (data.code) setCurrentOtpCode(data.code);
      setToast({ message: 'A new OTP code has been sent via Termii SMS & Email.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to resend OTP.', type: 'error' });
    }
  };

  // Forgot Password Request
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await forgotPassword(resetIdentifier);
      if (data.code) setCurrentOtpCode(data.code);
      setResetStep(2);
      setToast({ message: 'Reset OTP code sent via Termii SMS & Email.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to send reset code.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Confirm
  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(resetIdentifier, resetOtpCode, newPassword);
      setShowResetModal(false);
      setCurrentOtpCode('');
      setResetStep(1);
      setResetIdentifier('');
      setResetOtpCode('');
      setNewPassword('');
      setToast({ message: 'Password reset successfully! Please sign in with your new password.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to reset password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-xl shadow-brand-600/30 mx-auto mb-4 border border-brand-400/30">
            <FileCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DFOS Academic Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Digital File Opening System • Sign In</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel bg-white/95 rounded-2xl p-8 shadow-2xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address or Matric Number
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@dfos.edu or CSC/2026/001"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:border-brand-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetStep(1);
                  }}
                  className="text-xs font-bold text-brand-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:border-brand-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-900/20 hover:shadow-brand-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Credentials Helper Box for Demo */}
          <div className="mt-6 p-3.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-brand-600" /> Pre-Seeded Accounts:
            </p>
            <p>• <strong>Student:</strong> student.cs@dfos.edu / <code>Student@123456</code></p>
            <p>• <strong>CS Staff:</strong> staff.cs@dfos.edu / <code>Staff@123456</code></p>
            <p>• <strong>Super Admin:</strong> admin@dfos.edu / <code>Admin@123456</code></p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              New Student?{' '}
              <Link to="/register" className="font-bold text-brand-700 hover:underline">
                Create Account & Upload Files
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Verification Dialog Box Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Termii SMS OTP Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter 6-digit code sent to <strong>{otpPhoneOrEmail}</strong>
              </p>
            </div>

            {/* Prominent Stylish Test OTP Box Displayed Inside Dialog Box */}
            {currentOtpCode && (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border-2 border-amber-400 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                      <span className="text-[10px] font-extrabold tracking-widest text-amber-300 uppercase">
                        TEST OTP CODE
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xl font-black text-amber-300">
                      {currentOtpCode.split('').map((digit, idx) => (
                        <span key={idx} className="w-6 h-7 bg-slate-800 border border-amber-400/50 rounded flex items-center justify-center shadow-sm">
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOtpCode(currentOtpCode)}
                    className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 fill-slate-950" /> Auto-Fill
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-2xl font-bold tracking-widest py-3 border-2 border-slate-300 rounded-xl focus:border-brand-600 focus:ring-0"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-800 transition-colors shadow-md text-sm"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Continue'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-brand-700 font-semibold hover:underline"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Dialog Box Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Reset Account Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                {resetStep === 1
                  ? 'Enter your registered Email or Matric Number to receive an OTP'
                  : 'Enter the OTP code sent to your phone/email and set a new password'}
              </p>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email or Matric Number
                  </label>
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="student@dfos.edu or CSC/2026/001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-800 transition-colors shadow-md text-sm"
                >
                  {loading ? 'Sending OTP...' : 'Send Reset OTP Code'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {/* Prominent Stylish Test OTP Box Displayed Inside Reset Dialog Box */}
                {currentOtpCode && (
                  <div className="mb-5 p-3.5 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border-2 border-amber-400 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                          <span className="text-[10px] font-extrabold tracking-widest text-amber-300 uppercase">
                            RESET OTP CODE
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-xl font-black text-amber-300">
                          {currentOtpCode.split('').map((digit, idx) => (
                            <span key={idx} className="w-6 h-7 bg-slate-800 border border-amber-400/50 rounded flex items-center justify-center shadow-sm">
                              {digit}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setResetOtpCode(currentOtpCode)}
                        className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 fill-slate-950" /> Auto-Fill
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtpCode}
                      onChange={(e) => setResetOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center text-xl font-bold tracking-widest py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-brand-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {loading ? 'Resetting Password...' : 'Confirm & Update Password'}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-brand-700 font-semibold hover:underline"
                    >
                      Back to Step 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
