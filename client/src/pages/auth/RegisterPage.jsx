import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FileCheck, User, Mail, Phone, Lock, Hash, Building, ArrowRight, ShieldCheck, Cpu, Zap } from 'lucide-react';
import Toast from '../../components/Toast';

export const RegisterPage = () => {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    matricNo: '',
    password: '',
    departmentId: '',
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // OTP Verification Modal & Display State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [currentOtpCode, setCurrentOtpCode] = useState('');

  useEffect(() => {
    // Fetch departments from backend
    api.get('/documents/departments')
      .then((res) => {
        const depts = res.data.departments || [];
        setDepartments(depts);
        if (depts.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: depts[0].id }));
        }
      })
      .catch((err) => console.error('Failed to load departments:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ message: '', type: 'info' });

    try {
      const result = await register(formData);
      const generatedCode = result.otpInfo?.code || result.code || '';
      setCurrentOtpCode(generatedCode);
      setShowOtpModal(true);
      setToast({ message: 'Registration successful! Enter Termii OTP sent to your phone.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Registration failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(formData.phone, otpCode);
      setCurrentOtpCode('');
      setToast({ message: 'Account verified! Redirecting to student portal...', type: 'success' });
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Invalid OTP code.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const data = await resendOtp(formData.phone);
      if (data.code) setCurrentOtpCode(data.code);
      setToast({ message: 'Fresh OTP code sent via Termii SMS & Email.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to resend OTP.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden py-12">
      {/* Dynamic Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <div className="w-full max-w-lg relative z-10">
        {/* Faculty & Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-xl mx-auto mb-3 border border-brand-400/30">
            <Cpu className="w-9 h-9 text-blue-200" />
          </div>
          <span className="inline-block px-3 text-white py-1 bg-brand-500/20 text-brand-300 border border-brand-400/30 text-xs font-bold rounded-full mb-2">
            Faculty of Computing and Artificial Intelligence
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Registration</h1>
          <p className="text-slate-400 text-sm mt-1">Digital File Opening System (DFOS)</p>
        </div>

        {/* Registration Card */}
        <div className="glass-panel bg-white/95 rounded-2xl p-8 shadow-2xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@dfos.edu"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone (Termii OTP)
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Matric Number
                </label>
                <div className="relative">
                  <Hash className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="matricNo"
                    required
                    value={formData.matricNo}
                    onChange={handleChange}
                    placeholder="CSC/2026/001"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Academic Department
                </label>
                <div className="relative">
                  <Building className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="departmentId"
                    required
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none appearance-none"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-900/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Account & Send OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-brand-700 hover:underline">
                Sign In to Account
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
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Termii SMS OTP Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit code sent via Termii to <strong>{formData.phone}</strong>
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
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md text-sm"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Activate Account'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-brand-700 font-semibold hover:underline"
                >
                  Resend OTP
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
    </div>
  );
};

export default RegisterPage;
