import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Search,
  Filter,
  Download,
  Eye,
  Building,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Toast from '../../components/Toast';

export const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.departmentId = deptFilter;

      const res = await api.get('/admin/submissions', { params });
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      setToast({ message: 'Failed to load submissions.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/documents/departments').then((res) => setDepartments(res.data.departments || []));
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [search, statusFilter, deptFilter]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (deptFilter) params.append('departmentId', deptFilter);

    window.open(`http://localhost:5000/api/admin/reports/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Review Portal</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage academic department student file submissions, inspect document credentials, and issue decisions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">All Submissions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-blue-900">{stats.pending || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting Review</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Under Review</span>
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900">{stats.underReview || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active Staff Check</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-900">{stats.approved || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">File Verified</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-rose-900">{stats.rejected || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Action Required</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Reference Number, Matric No, or Name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand-600 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-56">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand-600 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-600" /> Loading submissions...
          </div>
        ) : submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-4">Reference Code</th>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Docs</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-brand-900">
                      {sub.referenceNumber || 'DFOS-DRAFT'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">{sub.user?.name || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500">{sub.user?.matricNo || sub.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {sub.user?.department?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {sub.submittedDocuments?.length || 0} Files
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/submissions/${sub.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review File
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No submissions found matching filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
