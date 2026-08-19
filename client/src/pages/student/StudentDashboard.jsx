import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { downloadAcknowledgementPdf } from '../../utils/download';
import {
  FileCheck,
  Upload,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building,
  User,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Toast from '../../components/Toast';

export const StudentDashboard = () => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const res = await api.post('/submissions');
      setSubmission(res.data.submission);
    } catch (err) {
      setToast({ message: 'Failed to fetch submission details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, []);

  // Step Progress logic
  const getStepState = (stepIndex) => {
    if (!submission) return 'pending';
    const status = submission.status;

    if (stepIndex === 1) return 'completed'; // Upload Checklist started
    if (stepIndex === 2) {
      return status !== 'DRAFT' ? 'completed' : 'current';
    }
    if (stepIndex === 3) {
      if (status === 'UNDER_REVIEW' || status === 'APPROVED' || status === 'REJECTED') return 'completed';
      if (status === 'PENDING') return 'current';
      return 'pending';
    }
    if (stepIndex === 4) {
      if (status === 'APPROVED') return 'completed';
      if (status === 'REJECTED') return 'rejected';
      if (status === 'UNDER_REVIEW') return 'current';
      return 'pending';
    }
    return 'pending';
  };

  const handleDownloadPdf = () => {
    if (!submission?.id) return;
    downloadAcknowledgementPdf(submission.id, submission.referenceNumber || 'DFOS');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-brand-700 font-semibold">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading student portal...</span>
        </div>
      </div>
    );
  }

  const isRejected = submission?.status === 'REJECTED';
  const isApproved = submission?.status === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-200 mb-3">
              <Building className="w-3.5 h-3.5" /> Academic Digital File Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Student Dashboard</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Track your file opening status, upload required department credentials, and download your auto-generated acknowledgement letter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/upload"
              className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              {submission?.status === 'DRAFT' || isRejected ? 'Upload & Manage Files' : 'View Uploaded Documents'}
            </Link>

            {submission?.acknowledgementPdfUrl && (
              <button
                onClick={handleDownloadPdf}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm border border-emerald-400/30"
              >
                <Download className="w-4 h-4 text-white" />
                Acknowledgement PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Progress Bar Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Submission Reference</p>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {submission?.referenceNumber || 'DFOS-DRAFT-NOT-SUBMITTED'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Current Status:</span>
            <StatusBadge status={submission?.status} size="lg" />
          </div>
        </div>

        {/* Rejection Alert Banner */}
        {isRejected && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900">Action Required: Document(s) Rejected</h4>
              <p className="text-xs text-rose-700 mt-1">
                One or more of your uploaded files require attention or replacement. Please review staff feedback comments on the upload page and re-upload corrected documents.
              </p>
              <Link
                to="/student/upload"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-950"
              >
                Go to Document Upload Page &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Step Progress Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: 1, title: '1. Prepare Files', desc: 'Select required department checklist' },
            { step: 2, title: '2. Submit File', desc: 'Finalize & auto-generate PDF' },
            { step: 3, title: '3. Department Review', desc: 'Staff inspects documents' },
            { step: 4, title: '4. Final Approval', desc: 'Official approval & verification' },
          ].map((item) => {
            const state = getStepState(item.step);
            return (
              <div
                key={item.step}
                className={`p-4 rounded-xl border transition-all ${
                  state === 'completed'
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : state === 'current'
                    ? 'bg-brand-50/60 border-brand-300 ring-2 ring-brand-600/20'
                    : state === 'rejected'
                    ? 'bg-rose-50/60 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      state === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : state === 'current'
                        ? 'bg-brand-600 text-white'
                        : state === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {state === 'completed' ? '✓' : item.step}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      state === 'completed'
                        ? 'text-emerald-900'
                        : state === 'current'
                        ? 'text-brand-900'
                        : state === 'rejected'
                        ? 'text-rose-900'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Uploaded Summary & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" /> Uploaded Document Checklist
            </h3>
            <Link
              to="/student/upload"
              className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
            >
              Manage Documents <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {submission?.submittedDocuments?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {submission.submittedDocuments.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                      {doc.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{doc.documentType?.name}</p>
                      <p className="text-xs text-slate-500">{doc.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No documents uploaded yet.</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Visit the upload page to attach required department documents.
              </p>
              <Link
                to="/student/upload"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-900 text-white rounded-lg font-semibold text-xs hover:bg-brand-800"
              >
                <Upload className="w-3.5 h-3.5" /> Start Uploading
              </Link>
            </div>
          )}
        </div>

        {/* Timeline & Status History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <Clock className="w-5 h-5 text-brand-600" /> Status Audit History
          </h3>

          {submission?.statusHistories?.length > 0 ? (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {submission.statusHistories.map((hist) => (
                <div key={hist.id} className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-brand-600 border-2 border-white ring-2 ring-brand-100" />
                  <p className="text-xs font-bold text-slate-900">
                    Status changed to <span className="text-brand-700">{hist.newStatus.replace('_', ' ')}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    By: {hist.changer?.name || 'System Admin'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(hist.changedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No status history logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
